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
module.exports = router;
