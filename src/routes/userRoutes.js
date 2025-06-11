const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  createUser,
  getUserById,
  getUserByUsername,
} = require("../models/userModel");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// GET /users - list all users (admin only)
router.get("/", verifyToken, requireRole(["admin"]), async (req, res) => {
  const users = await getAllUsers();
  // Kembalikan array langsung, agar frontend bisa langsung pakai data
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      username: u.username,
      created_at: u.created_at,
    }))
  );
});

// POST /users - create user (admin only)
router.post("/", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, password, dan role wajib diisi" });
  }
  if (await getUserByEmail(email)) {
    return res.status(400).json({ error: "Email sudah terdaftar" });
  }
  // Hash password sederhana (untuk demo, gunakan bcrypt di produksi)
  const passwordHash = Buffer.from(password).toString("base64");
  const user = await createUser({ email, passwordHash, role });
  res
    .status(201)
    .json({ user: { id: user.id, email: user.email, role: user.role } });
});

// PUT /users/:id - update user (admin only)
router.put("/:id", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: "Email dan role wajib diisi" });
  }
  const users = await getAllUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User tidak ditemukan" });
  }
  // Cek email unik jika diubah
  if (user.email !== email && (await getUserByEmail(email))) {
    return res.status(400).json({ error: "Email sudah terdaftar" });
  }
  user.email = email;
  user.role = role;
  res.json({ user: { id: user.id, email: user.email, role: user.role } });
});

// DELETE /users/:id - delete user (admin only)
router.delete("/:id", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User tidak ditemukan" });
  }
  users.splice(idx, 1);
  res.json({ status: "deleted" });
});

module.exports = router;
