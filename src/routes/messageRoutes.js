const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const { findClientByToken } = require("../models/apiClientModel");

// POST /messages
router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing or invalid token" });

  const token = authHeader.split(" ")[1];
  const client = findClientByToken(token);
  if (!client)
    return res.status(403).json({ error: "Invalid API client token" });

  const { clientId, to, message } = req.body;
  if (!clientId || !to || !message)
    return res.status(400).json({ error: "Missing required fields" });

  const session = sessionManager.getSession(clientId);
  if (!session)
    return res.status(404).json({ error: "Client session not found" });

  try {
    const sent = await session.sendMessage(to, message);
    res.json({ status: "Message sent", id: sent.id.id });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to send message", detail: err.message });
  }
});

module.exports = router;
