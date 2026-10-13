const fs = require("fs");
const path = require("path");

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

async function forwardToApp() {
  const portArg = process.argv[2];
  const targetPort = portArg || process.env.NGROK_UPSTREAM || "5173";
  const addr = targetPort.toString().includes(":") ? targetPort : `localhost:${targetPort}`;
  const authtoken = process.env.NGROK_AUTHTOKEN || DEFAULT_AUTHTOKEN;

  console.log(`\n🔗 Forwarding Bank of Maldives app to ${addr}...`);

  // Attempt forward with custom domain first, fall back to dynamic if not reserved
  try {
    const forwarder = await ngrok.forward({
      addr: addr,
      authtoken: authtoken,
      domain: CUSTOM_DOMAIN,
    });
    console.log(`\n======================================================`);
    console.log(`🚀 Bank of Maldives Internet Banking Tunnel Active`);
    console.log(`📍 Local Address : http://${addr}`);
    console.log(`🌐 Public URL     : ${forwarder.url()}`);
    console.log(`======================================================\n`);
    return forwarder;
  } catch (err) {
    // If the custom domain is not yet reserved on the user's ngrok dashboard, fallback gracefully
    if (err.message && (err.message.includes("domain") || err.message.includes("ERR_NGROK_"))) {
      console.log(`⚠️  Custom domain (${CUSTOM_DOMAIN}) note: ${err.message}`);
      console.log(`🔄 Launching with standard tunnel URL...`);
      try {
        const fallbackForwarder = await ngrok.forward({
          addr: addr,
          authtoken: authtoken,
        });
        console.log(`\n======================================================`);
        console.log(`🚀 Bank of Maldives Internet Banking Tunnel Active`);
        console.log(`📍 Local Address : http://${addr}`);
        console.log(`🌐 Public URL     : ${fallbackForwarder.url()}`);
        console.log(`======================================================\n`);
        return fallbackForwarder;
      } catch (fallbackErr) {
        console.error("Ngrok error:", fallbackErr.message);
      }
    } else {
      console.error("Ngrok error:", err.message);
    }
  }
}

if (require.main === module) {
  forwardToApp().then(() => {
    setInterval(() => {}, 1000 * 60 * 60);
  });
}

module.exports = { forwardToApp };
