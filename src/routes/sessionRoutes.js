const express = require("express");
const router = express.Router();
const sessionManager = require("../clients/sessionManager");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

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
  const qrImage = sessionManager.getQrCode(clientId);
  if (!qrImage) {
    return res
      .status(404)
      .json({ error: "QR not found or session already authenticated" });
  }
  res.json({ clientId, qrImage });
});

// GET /sessions/:clientId
router.get("/:clientId/status", (req, res) => {
  const { clientId } = req.params;
  const session = sessionManager.getSession(clientId);
  // const status = sessionManager.getStatus(clientId);

  if (!session) return res.status(404).json({ status: "not_found" });

  const state = session.state || "unknown";
  res.json({ clientId, status: state });
});

module.exports = router;
