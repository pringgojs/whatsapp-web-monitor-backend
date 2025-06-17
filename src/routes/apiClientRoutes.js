const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const {
  createClient,
  listClients,
  deleteClient,
  updateWebhook,
} = require("../controllers/apiClientController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const {
  getAllClients,
  registerApiClient,
  deleteClientById,
  findClientByToken,
} = require("../models/apiClientModel");
const crypto = require("crypto");

// Tambah client baru (CRUD utama)
router.post("/", verifyToken, requireRole(["admin", "user"]), createClient);

// GET /clients
router.get("/", verifyToken, requireRole(["admin", "user"]), listClients);

// DELETE /clients/:clientId
router.delete(
  "/:clientId",
  verifyToken,
  requireRole(["admin", "user"]),
  deleteClient
);

// PATCH /clients/:clientId/webhook - update webhook client
router.patch(
  "/:clientId/webhook",
  verifyToken,
  requireRole(["admin", "user"]),
  updateWebhook
);

// POST /clients/:clientId/disconnect (logout)
router.post("/:clientId/disconnect", (req, res) => {
  const { clientId } = req.params;
  const session = sessionManager.getSession(clientId);
  if (!session) {
    return res.status(404).json({ error: "Session tidak ditemukan." });
  }
  if (typeof session.logout === "function") {
    session.logout(); // logout WhatsApp client secara resmi
    sessionManager.sessionStatus[clientId] = "disconnected";
    sessionManager.qrCodes[clientId] = null;
    delete sessionManager.sessions[clientId];
    return res.json({ status: "disconnected", clientId, method: "logout" });
  } else {
    return res.status(500).json({ error: "Fungsi logout tidak tersedia." });
  }
});

// POST /clients/:clientId/destroy (putus koneksi tanpa logout)
router.post("/:clientId/destroy", (req, res) => {
  const { clientId } = req.params;
  const session = sessionManager.getSession(clientId);
  if (!session) {
    return res.status(404).json({ error: "Session tidak ditemukan." });
  }
  if (typeof session.destroy === "function") {
    session.destroy(); // hanya putus koneksi, session tetap ada
    sessionManager.sessionStatus[clientId] = "destroyed";
    sessionManager.qrCodes[clientId] = null;
    // Jangan hapus sessionManager.sessions[clientId] agar client tetap muncul di daftar
    return res.json({ status: "destroyed", clientId, method: "destroy" });
  } else {
    return res.status(500).json({ error: "Fungsi destroy tidak tersedia." });
  }
});

// GET /clients/:clientId/token - get API key for a client (owner or admin only)
router.get(
  "/:clientId/token",
  verifyToken,
  requireRole(["admin", "user"]),
  async (req, res) => {
    const { clientId } = req.params;
    const clients = await getAllClients();
    const client = clients.find(
      (c) =>
        c.id === clientId &&
        (c.ownerId === req.user.id || req.user.role === "admin")
    );
    if (!client) {
      return res
        .status(404)
        .json({ error: "Client tidak ditemukan atau tidak punya akses." });
    }
    res.json({ token: client.token });
  }
);

// POST /clients/:clientId/token - generate new API key for a client
router.post(
  "/:clientId/token",
  verifyToken,
  requireRole(["admin", "user"]),
  require("../controllers/apiClientController").updateApiKey
);

// GET /clients/:clientId - get detail client (webhookUrl & webhookHeaders)
router.get(
  "/:clientId",
  verifyToken,
  requireRole(["admin", "user"]),
  async (req, res) => {
    const { clientId } = req.params;
    const clients = await getAllClients();
    const client = clients.find(
      (c) =>
        c.id === clientId &&
        (c.ownerId === req.user.id || req.user.role === "admin")
    );
    if (!client) {
      return res
        .status(404)
        .json({ error: "Client tidak ditemukan atau tidak punya akses." });
    }
    res.json({ client });
  }
);

module.exports = router;
