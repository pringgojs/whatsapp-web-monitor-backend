const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  createUser,
  getUserByUsername,
  getUserByEmail,
} = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

exports.register = async (req, res) => {
  const { email, username, password, role } = req.body;
  if (!email || !username || !password || !role)
    return res.status(400).json({ error: "Incomplete data" });

  if (await getUserByEmail(email))
    return res.status(409).json({ error: "Email already exists" });
  if (await getUserByUsername(username))
    return res.status(409).json({ error: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ email, username, passwordHash, role });

  res.status(201).json({
    message: "User created",
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ message: "Login successful", token });
};
