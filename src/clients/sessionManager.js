const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const axios = require("axios"); // Tambah axios untuk webhook

// Webhook config per client (in-memory, bisa dipindah ke DB jika perlu)
// Sekarang juga menyimpan custom headers per client
let webhooks;
let webhookHeaders;
function getWebhooks() {
  if (!webhooks) {
    webhooks = require("../routes/sessionRoutes").webhooks || {};
  }
  return webhooks;
}
function getWebhookHeaders() {
  if (!webhookHeaders) {
    webhookHeaders = require("../routes/sessionRoutes").webhookHeaders || {};
  }
  return webhookHeaders;
}

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

    client.on("message", async (msg) => {
      // --- FILTER & IGNORE ---
      // Ignore group messages
      if (msg.from.split("@")[1]?.includes("g.us")) return;
      // Ignore notification/template
      if (["e2e_notification", "notification_template"].includes(msg.type))
        return;
      // Ignore status broadcast
      if (msg.id.remote === "status@broadcast") return;

      // --- THROTTLE/ANTISPAM: Batasi jumlah pesan masuk per detik per client ---
      if (!this._msgTimestamps) this._msgTimestamps = {};
      const now = Date.now();
      if (!this._msgTimestamps[clientId]) this._msgTimestamps[clientId] = [];
      // Hapus timestamp lebih dari 10 detik lalu
      this._msgTimestamps[clientId] = this._msgTimestamps[clientId].filter(
        (ts) => now - ts < 10000
      );
      if (this._msgTimestamps[clientId].length > 30) {
        // Jika lebih dari 30 pesan masuk dalam 10 detik, abaikan pesan
        if (this._msgTimestamps[clientId].length % 10 === 0) {
          console.warn(
            `[${clientId}] Terlalu banyak pesan masuk, throttle aktif (${this._msgTimestamps[clientId].length} pesan/10detik)`
          );
        }
        return;
      }
      this._msgTimestamps[clientId].push(now);
      // --- END THROTTLE ---

      // --- WEBHOOK LOGIC ---
      const webhookUrl = getWebhooks()[clientId];
      const customHeaders = getWebhookHeaders()[clientId] || {};
      let payload = null;
      let shouldSend = false;

      if (msg.type === "location") {
        payload = {
          number: msg.from,
          message: msg.location, // location object
          type: msg.type,
          timestamp: msg.timestamp,
        };
        shouldSend = true;
      } else if (msg.hasMedia) {
        // Tambahan: cek tipe media sebelum downloadMedia
        if (msg.type === "interactive" || msg.type === "unknown") {
          console.warn(
            `[${clientId}] Pesan media tipe tidak didukung: ${msg.type}`
          );
          return;
        }
        let attachmentData = null;
        try {
          attachmentData = await msg.downloadMedia();
        } catch (err) {
          console.error(`[${clientId}] Gagal download media:`, err.message);
          return; // Jangan proses lebih lanjut jika gagal download
        }
        if (!attachmentData || !attachmentData.mimetype) {
          console.warn(
            `[${clientId}] Media tidak valid atau mimetype tidak ditemukan.`
          );
          return;
        }
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "application/pdf",
          "audio/ogg; codecs=opus",
        ];
        if (allowedTypes.includes(attachmentData.mimetype)) {
          payload = {
            number: msg.from,
            message: attachmentData.data, // base64 string
            type: msg.type,
            mimetype: attachmentData.mimetype,
            filename: attachmentData.filename,
            body: msg.body,
            timestamp: msg.timestamp,
          };
          shouldSend = true;
        } else {
          console.warn(
            `[${clientId}] Mimetype tidak diizinkan: ${attachmentData.mimetype}`
          );
        }
      } else if (!(msg.body === "" && msg.type === "e2e_notification")) {
        payload = {
          number: msg.from,
          message: msg.body,
          type: msg.type,
          timestamp: msg.timestamp,
        };
        shouldSend = true;
      }

      console.log("payload:", payload, webhookUrl, shouldSend);
      if (webhookUrl && shouldSend && payload) {
        try {
          console.log(`[${clientId}] Sending webhook to ${webhookUrl}`);
          await axios.post(webhookUrl, payload, {
            timeout: 15000, // 15 detik
            headers: {
              "Content-Type": "application/json",
              ...customHeaders,
            },
          });
        } catch (err) {
          console.error(`[${clientId}] Webhook error:`, err.message);
        }
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
