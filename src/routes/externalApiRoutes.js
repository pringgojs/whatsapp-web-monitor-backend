const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const { verifyApiKey } = require("../middlewares/apiKeyMiddleware");
const { sendMessageHandler } = require("../utils/sendMessageHandler");

// POST /api/messages/send (API key only)
router.post("/messages/send", verifyApiKey, async (req, res) => {
  const { to, message } = req.body;
  const clientId = req.apiClient.id;
  if (!to || !message)
    return res.status(400).json({ error: "Missing required fields" });

  const session = sessionManager.getSession(clientId);
  // Gunakan handler utilitas
  return sendMessageHandler(session, to, message, res);
});

module.exports = router;
