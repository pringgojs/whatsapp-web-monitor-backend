const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Simpan webhook per client (in-memory)
const webhooks = {};

// POST /sessions/:clientId
router.post("/:clientId", (req, res) => {
  const { clientId } = req.params;
  const session = sessionManager.createSession(clientId);
  res.status(201).json({ status: "Session created", clientId });
});

// GET /sessions
router.get("/", (req, res) => {
  const sessions = sessionManager.getAllSessions();
  res.json({ sessions });
});

// POST /sessions/:clientId
// Protected route, requires authentication and role check
router.post(
  "/:clientId",
  verifyToken,
  requireRole(["admin", "user"]),
  (req, res) => {
    const { clientId } = req.params;
    const session = sessionManager.createSession(clientId);
    res.status(201).json({ status: "Session created", clientId });
  }
);

// GET /sessions/:clientId/qr
router.get("/:clientId/qr", (req, res) => {
  const { clientId } = req.params;
  // Pastikan session sudah ada dan status QR
  const status = sessionManager.getStatus(clientId);
  if (status !== "qr") {
    return res
      .status(404)
      .json({ error: "QR not available. Status: " + status });
  }
  const qrImage = sessionManager.getQrCode(clientId);
  if (!qrImage) {
    return res
      .status(404)
      .json({ error: "QR not found or session already authenticated" });
  }
  res.json({ clientId, qrImage });
});

// GET /sessions/:clientId/status
router.get("/:clientId/status", async (req, res) => {
  const { clientId } = req.params;
  // Ambil status dari sessionManager, meskipun session null
  const status = sessionManager.getStatus(clientId);
  let waNumber = null;
  if (status === "ready") {
    // Ambil nomor WhatsApp jika status ready
    try {
      const info = await sessionManager.getClientInfo(clientId);
      waNumber = info.waNumber || null;
    } catch (e) {
      waNumber = null;
    }
  }
  res.json({ clientId, status, waNumber });
});

// GET /sessions/:clientId/info
router.get("/:clientId/info", async (req, res) => {
  const { clientId } = req.params;
  const info = await sessionManager.getClientInfo(clientId);
  res.json(info);
});

// POST /sessions/:clientId/webhook
router.post("/:clientId/webhook", (req, res) => {
  const { clientId } = req.params;
  const { webhookUrl } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ error: "Webhook URL is required" });
  }
  webhooks[clientId] = webhookUrl;
  res.json({ status: "ok", clientId, webhookUrl });
});

// GET /sessions/:clientId/webhook
router.get("/:clientId/webhook", (req, res) => {
  const { clientId } = req.params;
  const webhookUrl = webhooks[clientId] || null;
  res.json({ clientId, webhookUrl });
});

module.exports = router;
