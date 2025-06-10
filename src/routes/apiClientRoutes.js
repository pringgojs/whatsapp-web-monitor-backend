const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const {
  createClient,
  listClients,
  deleteClient,
} = require("../controllers/apiClientController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Tambah client baru (CRUD utama)
router.post(
  "/",
  verifyToken,
  requireRole(["admin", "user"]),
  (req, res, next) => {
    // Validasi: id harus unik
    const { id } = req.body;
    const clients = require("../models/apiClientModel").getAllClients();
    if (clients.find((c) => c.id === id)) {
      return res.status(400).json({ error: "Client ID sudah terdaftar." });
    }
    next();
  },
  createClient
);

router.get("/", verifyToken, requireRole(["admin", "user"]), listClients);

// DELETE /clients/:clientId (delete client dari model utama dan hapus session WhatsApp jika ada)
router.delete(
  "/:clientId",
  verifyToken,
  requireRole(["admin", "user"]),
  (req, res, next) => {
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
    next();
  },
  deleteClient
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

module.exports = router;
