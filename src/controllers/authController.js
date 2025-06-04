const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

exports.register = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return res.status(400).json({ error: "Incomplete data" });

  if (findUserByEmail(email))
    return res.status(409).json({ error: "User already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ email, passwordHash, role });

  res
    .status(201)
    .json({
      message: "User created",
      user: { id: user.id, email: user.email, role: user.role },
    });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = findUserByEmail(email);
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ message: "Login successful", token });
};
