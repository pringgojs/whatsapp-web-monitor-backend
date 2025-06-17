const crypto = require("crypto");
const {
  registerApiClient,
  getAllClients,
  deleteClientById,
} = require("../models/apiClientModel");

exports.createClient = async (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const ownerId = req.user.id;
  try {
    const client = await registerApiClient({ id, name, token, ownerId });
    return res.status(201).json({
      message: "Client created",
      client: { id: client.id, name: client.name, token: client.token },
    });
  } catch (e) {
    return res.status(500).json({ error: "Gagal membuat client" });
  }
};

exports.listClients = (req, res) => {
  const clients = getAllClients().filter(
    (c) => c.ownerId === req.user.id || req.user.role === "admin"
  );
  res.json({ clients });
};

exports.deleteClient = (req, res) => {
  const { clientId } = req.params;
  console.log("proses delete client", clientId);
  // Only allow owner or admin to delete
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
  const deleted = deleteClientById(clientId);
  if (deleted) {
    return res.json({ status: "deleted", clientId });
  } else {
    return res.status(500).json({ error: "Gagal menghapus client." });
  }
};
