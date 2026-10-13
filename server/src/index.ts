import { app } from './app';
import { connectDB, disconnectDB } from './config/db';
import { seedDatabase } from './scripts/seed';
import { ENV } from './config/env';

async function bootstrap() {
  try {
    await connectDB();
    await seedDatabase();

    const server = app.listen(ENV.PORT, () => {
      console.log(`======================================================`);
      console.log(`🚀 Bank of Maldives Internet Banking REST API running on port ${ENV.PORT}`);
      console.log(`🌐 Base URL: http://localhost:${ENV.PORT}/api/v1`);
      console.log(`🌐 Official Portal: https://www.bankofmaldives.com.mv/internetbanking`);
      console.log(`⚠️  DISCLAIMER: DEMO-ONLY FINTECH SIMULATION`);
      console.log(`   NO REAL MONEY MOVEMENT OR SETTLEMENT OCCURS`);
      console.log(`======================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Shutdown] Closing Bank of Maldives server and disconnecting database...');
      server.close(async () => {
        await disconnectDB();
        console.log('[Shutdown] Cleanup complete. Exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Bootstrap Error] Failed to start Bank of Maldives server:', error);
    process.exit(1);
  }
}

bootstrap();
