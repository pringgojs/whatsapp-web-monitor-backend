const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const {
  createClient,
  listClients,
} = require("../controllers/apiClientController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, requireRole(["admin"]), createClient);
router.get("/", verifyToken, requireRole(["admin", "user"]), listClients);

// DELETE /clients/:clientId
router.delete("/:clientId", (req, res) => {
  const { clientId } = req.params;
  const session = sessionManager.getSession(clientId);
  const status = sessionManager.getStatus(clientId);
  if (status === "ready" || status === "connected") {
    return res.status(400).json({
      error:
        "Client sedang terhubung, tidak bisa diedit. Silakan disconnect terlebih dahulu.",
    });
  }
  if (session) {
    session.destroy(); // disconnect WhatsApp client
    delete sessionManager.sessions[clientId];
    sessionManager.qrCodes[clientId] = null;
    sessionManager.sessionStatus[clientId] = "deleted";
    return res.json({ status: "deleted", clientId });
  } else {
    // Jika session tidak ada, tetap hapus data status/qr
    delete sessionManager.qrCodes[clientId];
    delete sessionManager.sessionStatus[clientId];
    return res.json({ status: "deleted", clientId });
  }
});

module.exports = router;
