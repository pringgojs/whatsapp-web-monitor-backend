const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { formatWaNumber } = require("../utils/waNumber");
const { sendMessageHandler } = require("../utils/sendMessageHandler");

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
    // Gunakan handler utilitas
    return sendMessageHandler(session, to, message, res);
  }
);

module.exports = router;
