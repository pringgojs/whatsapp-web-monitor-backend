const express = require("express");
const router = express.Router();
const {
  createClient,
  listClients,
} = require("../controllers/apiClientController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, requireRole(["admin"]), createClient);
router.get("/", verifyToken, requireRole(["admin", "user"]), listClients);

module.exports = router;
