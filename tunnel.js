const fs = require("fs");
const path = require("path");

// Load .env from root or server folder if exists
[path.join(__dirname, ".env"), path.join(__dirname, "server", ".env")].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const k = trimmed.substring(0, eqIdx).trim();
          let v = trimmed.substring(eqIdx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) process.env[k] = v;
        }
      }
    } catch (_) {}
  }
});

const ngrok = require("@ngrok/ngrok");

const DEFAULT_AUTHTOKEN = "3KbPEiInzqTdXXpKGOpj3VRzV4c_4oo4QEYd3Uk27zDcDVQb8";
const CUSTOM_DOMAIN = process.env.NGROK_DOMAIN || "immunity-encrypt-crushing.ngrok-free.dev";

/**
 * Ngrok Public Tunnel Forwarder
 * Automatically tunnels local ports to a public URL via @ngrok/ngrok.
 * 
 * Usage:
 *   node tunnel.js          -> forwards to Bank of Maldives frontend on 5173
 *   node tunnel.js 5173     -> forwards to frontend on 5173
 *   node tunnel.js 5001     -> forwards to backend API on 5001
 */
async function forwardToApp() {
  const portArg = process.argv[2];
  const targetPort = portArg || process.env.TUNNEL_PORT || process.env.NGROK_UPSTREAM || "5173";
  const addr = targetPort.toString().includes(":") ? targetPort : `localhost:${targetPort}`;
  const authtoken = process.env.NGROK_AUTHTOKEN || DEFAULT_AUTHTOKEN;

  console.log(`\n🔗 Initializing Bank of Maldives Ngrok tunnel to ${addr}...`);

  try {
    let forwarder;
    try {
      forwarder = await ngrok.forward({
        addr: addr,
        authtoken: authtoken,
        domain: CUSTOM_DOMAIN,
      });
    } catch (err) {
      if (err.message && (err.message.includes("domain") || err.message.includes("ERR_NGROK_"))) {
        console.log(`⚠️  Custom domain note: ${err.message}`);
        console.log(`🔄 Launching with standard tunnel URL...`);
        forwarder = await ngrok.forward({
          addr: addr,
          authtoken: authtoken,
        });
      } else {
        throw err;
      }
    }

    console.log(`======================================================`);
    console.log(`⚡ Bank of Maldives Internet Banking Tunnel Active`);
    console.log(`📍 Local Address : http://${addr}`);
    console.log(`🌐 Public URL     : ${forwarder.url()}`);
    console.log(`======================================================`);
    console.log(`Press Ctrl+C to close the tunnel.\n`);

    // Keep process alive
    process.on("SIGINT", async () => {
      console.log("\n[Ngrok] Closing tunnel...");
      try {
        await forwarder.close();
      } catch (_) {}
      console.log("[Ngrok] Tunnel closed.");
      process.exit(0);
    });

    return forwarder;
  } catch (err) {
    console.error(`\n❌ Failed to establish Ngrok tunnel:`, err.message || err);
    if (!process.env.NGROK_AUTHTOKEN) {
      console.log(`\n💡 Note: Ngrok requires a free auth token.`);
      console.log(`   1. Sign up or log in at: https://dashboard.ngrok.com/get-started/your-authtoken`);
      console.log(`   2. Set your token:`);
      console.log(`      export NGROK_AUTHTOKEN="your_token_here"`);
      console.log(`   3. Run tunnel again:`);
      console.log(`      npm run tunnel\n`);
    }
  }
}

// Execute tunnel and keep process alive
if (require.main === module) {
  forwardToApp().then(() => {
    setInterval(() => {}, 1000 * 60 * 60);
  });
}

module.exports = { forwardToApp };
