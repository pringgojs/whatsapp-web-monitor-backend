const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const {
  createClient,
  listClients,
  deleteClient,
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
router.post(
  "/",
  verifyToken,
  requireRole(["admin", "user"]),
  async (req, res) => {
    // Validasi: id harus unik
    const { id, name, user_id, created_by } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const clients = await getAllClients();
    if (clients.find((c) => c.id === id)) {
      return res.status(400).json({ error: "Client ID sudah terdaftar." });
    }
    // Buat token baru
    const token = crypto.randomBytes(32).toString("hex");
    const ownerId = req.user.id;
    const client = await registerApiClient({
      id,
      name,
      token,
      ownerId,
      user_id,
      created_by,
    });
    res.json(client);
  }
);

router.get(
  "/",
  verifyToken,
  requireRole(["admin", "user"]),
  async (req, res) => {
    const clients = await getAllClients();
    // Filter hanya client milik user login atau admin
    const filtered = clients.filter(
      (c) => c.ownerId === req.user.id || req.user.role === "admin"
    );
    res.json({ clients: filtered });
  }
);

// DELETE /clients/:clientId (delete client dari model utama dan hapus session WhatsApp jika ada)
router.delete(
  "/:clientId",
  verifyToken,
  requireRole(["admin", "user"]),
  async (req, res) => {
    const { clientId } = req.params;
    const session = sessionManager.getSession(clientId);
    if (session) {
      session.destroy();
      delete sessionManager.sessions[clientId];
      sessionManager.qrCodes[clientId] = null;
      sessionManager.sessionStatus[clientId] = "deleted";
    } else {
      delete sessionManager.qrCodes[clientId];
      delete sessionManager.sessionStatus[clientId];
    }
    const deleted = await deleteClientById(clientId);
    if (deleted) {
      res.json({ status: "deleted", clientId });
    } else {
      res.status(404).json({ error: "Client tidak ditemukan." });
    }
  }
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
  (req, res) => {
    const { clientId } = req.params;
    const clients = getAllClients();
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
  (req, res) => {
    const { clientId } = req.params;
    const clients = getAllClients();
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
    // Generate new token
    const newToken = crypto.randomBytes(32).toString("hex");
    client.token = newToken;
    res.json({ token: newToken });
  }
);

module.exports = router;
