const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { formatWaNumber } = require("../utils/waNumber");

// POST /messages
router.post(
  "/",
  verifyToken,
  requireRole(["admin", "user"]),
  async (req, res) => {
    const { clientId, to, message } = req.body;
    if (!clientId || !to || !message)
      return res.status(400).json({ error: "Missing required fields" });

    const session = sessionManager.getSession(clientId);
    if (!session)
      return res.status(404).json({ error: "Client session not found" });

    if (!/^62\d{8,15}$/.test(to)) {
      return res
        .status(400)
        .json({ error: "Nomor tujuan harus format 62xxxxxxxxxxx dan valid." });
    }

    // Format nomor tujuan
    const waNumber = formatWaNumber(to);
    if (!waNumber) {
      return res.status(400).json({ error: "Nomor tujuan tidak valid." });
    }

    // Cek apakah nomor terdaftar di WhatsApp
    const isRegistered = await session.isRegisteredUser(waNumber);
    if (!isRegistered) {
      return res
        .status(400)
        .json({ error: "Nomor tidak terdaftar di WhatsApp." });
    }

    try {
      const sent = await session.sendMessage(waNumber, message);
      res.json({ status: "Message sent", id: sent.id.id });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to send message", detail: err.message });
    }
  }
);

module.exports = router;
