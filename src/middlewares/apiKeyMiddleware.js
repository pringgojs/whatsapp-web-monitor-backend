// Middleware untuk verifikasi API key client
const { findClientByToken } = require("../models/apiClientModel");

function verifyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }
  const client = findClientByToken(apiKey);
  if (!client) {
    return res.status(403).json({ error: "Invalid API key" });
  }
  req.apiClient = client; // simpan info client di req
  next();
}

module.exports = { verifyApiKey };
