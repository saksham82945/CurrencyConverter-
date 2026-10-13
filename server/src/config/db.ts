import mongoose, { ClientSession } from 'mongoose';
import { MongoMemoryReplSet, MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env';

let replSetInstance: MongoMemoryReplSet | null = null;
let memoryServerInstance: MongoMemoryServer | null = null;
let supportsTransactions = false;

export async function connectDB(): Promise<string> {
  let uri = ENV.MONGODB_URI;

  if (!uri) {
    if (!replSetInstance && !memoryServerInstance) {
      console.log('[DB] Initializing in-memory MongoDB Replica Set for ACID transactions...');
      try {
        replSetInstance = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
        uri = replSetInstance.getUri();
        supportsTransactions = true;
        console.log('[DB] MongoMemoryReplSet initialized successfully.');
      } catch (err) {
        console.warn('[DB] Fallback to standalone MongoMemoryServer:', err);
        memoryServerInstance = await MongoMemoryServer.create();
        uri = memoryServerInstance.getUri();
        supportsTransactions = false;
      }
    } else {
      uri = replSetInstance ? replSetInstance.getUri() : memoryServerInstance!.getUri();
    }
  } else {
    supportsTransactions = true;
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB at: ${uri.split('@').pop()}`);
  }

  // Pre-create collections to prevent DDL catalog lock collisions during transactions
  const models = mongoose.modelNames();
  for (const name of models) {
    try {
      await mongoose.model(name).createCollection();
    } catch {
      // Ignore if collection already exists
    }
  }

  return uri;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSetInstance) {
    await replSetInstance.stop();
    replSetInstance = null;
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}

/**
 * Execute a unit of work inside an ACID transaction when supported.
 */
export async function runInTransaction<T>(
  work: (session: ClientSession | null) => Promise<T>
): Promise<T> {
  if (!supportsTransactions) {
    return await work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await work(session);
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
