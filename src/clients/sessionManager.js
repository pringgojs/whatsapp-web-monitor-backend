const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

class SessionManager {
  constructor() {
    this.sessions = {}; // { clientId: ClientInstance }
    this.qrCodes = {}; // simpan qr base64
    this.sessionStatus = {}; // key: clientId, value: string
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

    client.on("qr", async (qr) => {
      console.log(`[${clientId}] QR Code:\n${qr}`);
      this.sessionStatus[clientId] = "qr";

      const qrImage = await qrcode.toDataURL(qr); // base64
      this.qrCodes[clientId] = qrImage;
    });

    client.on("ready", () => {
      console.log(`[${clientId}] WhatsApp client ready`);
    });

    client.on("authenticated", () => {
      console.log(`[${clientId}] Authenticated`);
    });

    client.on("disconnected", (reason) => {
      console.log(`[${clientId}] Disconnected: ${reason}`);
      this.sessionStatus[clientId] = "disconnected";
      this.qrCodes[clientId] = null; // clear QR code on disconnect

      delete this.sessions[clientId];
    });

    client.on("auth_failure", () => {
      this.sessionStatus[clientId] = "auth_failure";
      console.log(`[${clientId}] Auth failure`);
    });

    client.initialize();
    this.sessions[clientId] = client;
    return client;
  }

  getSession(clientId) {
    return this.sessions[clientId] || null;
  }

  getQrCode(clientId) {
    return this.qrCodes?.[clientId] || null;
  }

  getAllSessions() {
    return Object.keys(this.sessions);
  }

  getStatus(clientId) {
    return this.sessionStatus?.[clientId] || "unknown";
  }
}

module.exports = new SessionManager();
