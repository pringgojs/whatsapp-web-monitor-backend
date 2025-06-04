const crypto = require("crypto");
const {
  registerApiClient,
  getAllClients,
} = require("../models/apiClientModel");

exports.createClient = (req, res) => {
  const { name } = req.body;
  const token = crypto.randomBytes(20).toString("hex"); // API key

  const client = registerApiClient({ name, token, ownerId: req.user.id });

  res
    .status(201)
    .json({
      message: "Client created",
      client: { id: client.id, name: client.name, token },
    });
};

exports.listClients = (req, res) => {
  const clients = getAllClients().filter(
    (c) => c.ownerId === req.user.id || req.user.role === "admin"
  );
  res.json({ clients });
};
