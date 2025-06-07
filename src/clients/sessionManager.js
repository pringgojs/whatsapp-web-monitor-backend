const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

class SessionManager {
  constructor() {
    this.sessions = {}; // { clientId: ClientInstance }
    this.qrCodes = {}; // simpan qr base64
    this.sessionStatus = {}; // key: clientId, value: string
  }

  createSession(clientId) {
    // Jika session ada tapi status destroyed/disconnected, hapus dan buat ulang
    if (this.sessions[clientId]) {
      const status = this.sessionStatus[clientId];
      if (status !== "destroyed" && status !== "disconnected") {
        return this.sessions[clientId];
      } else {
        // Hapus session lama
        try {
          this.sessions[clientId].destroy && this.sessions[clientId].destroy();
        } catch (e) {}
        delete this.sessions[clientId];
      }
    }

    // Jika status sebelumnya destroyed, ubah ke initializing
    if (this.sessionStatus[clientId] === "destroyed") {
      this.sessionStatus[clientId] = "initializing";
    }
    if (this.sessionStatus[clientId] === "disconnected") {
      this.sessionStatus[clientId] = "initializing";
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
      this.sessionStatus[clientId] = "ready";
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

    client.on("message", (msg) => {
      if (msg.body == "!ping") {
        msg.reply("pong");
      }
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

  async getClientInfo(clientId) {
    const session = this.getSession(clientId);
    let waNumber = null;
    console.log("user:", clientId, session.info.me.user);
    if (session && session.info && session.info.me && session.info.me.user) {
      waNumber = session.info.me.user;
      console.log("info", waNumber);
    } else {
      // fallback: format dari clientId
      let num = String(clientId).replace(/\D/g, "");
      if (num.startsWith("0")) num = "62" + num.slice(1);
      if (!num.startsWith("62")) num = "62" + num;
      num = num.replace(/^620+/, "62");
      if (num.length < 10) num = null;
      waNumber = num;
    }
    return {
      clientId,
      waNumber,
    };
  }
}

module.exports = new SessionManager();
