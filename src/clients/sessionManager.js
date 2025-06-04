const { Client, LocalAuth } = require("whatsapp-web.js");

class SessionManager {
  constructor() {
    this.sessions = {}; // { clientId: ClientInstance }
  }

  createSession(clientId) {
    if (this.sessions[clientId]) {
      return this.sessions[clientId];
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
      puppeteer: {
        headless: true, // ganti false kalau mau debug browser
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    client.on("qr", (qr) => {
      console.log(`[${clientId}] QR Code:\n${qr}`);
    });

    client.on("ready", () => {
      console.log(`[${clientId}] WhatsApp client ready`);
    });

    client.on("authenticated", () => {
      console.log(`[${clientId}] Authenticated`);
    });

    client.on("disconnected", (reason) => {
      console.log(`[${clientId}] Disconnected: ${reason}`);
      delete this.sessions[clientId];
    });

    client.initialize();
    this.sessions[clientId] = client;
    return client;
  }

  getSession(clientId) {
    return this.sessions[clientId] || null;
  }

  getAllSessions() {
    return Object.keys(this.sessions);
  }
}

module.exports = new SessionManager();
