const crypto = require("crypto");
const {
  registerApiClient,
  getAllClients,
  deleteClientById,
  updateClientWebhook,
  updateClientToken,
} = require("../models/apiClientModel");
const sessionManager = require("../clients/sessionManager");

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

exports.listClients = async (req, res) => {
  console.log("proses list clients");
  const clients = await getAllClients();
  const filtered = clients.filter(
    (c) => c.ownerId === req.user.id || req.user.role === "admin"
  );
  // Trigger session dan ambil status
  const clientsWithStatus = filtered.map((client) => {
    // Trigger session jika belum ada
    if (!sessionManager.getSession(client.id)) {
      sessionManager.createSession(client.id);
    }
    return {
      ...client,
      waStatus: sessionManager.getStatus(client.id),
    };
  });
  res.json({ clients: clientsWithStatus });
};

exports.deleteClient = async (req, res) => {
  const { clientId } = req.params;
  console.log("proses delete client", clientId);
  // Only allow owner or admin to delete
  const clients = await getAllClients();
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
  const deleted = await deleteClientById(clientId);
  if (deleted) {
    return res.json({ status: "deleted", clientId });
  } else {
    return res.status(500).json({ error: "Gagal menghapus client." });
  }
};

// Update webhook client
exports.updateWebhook = async (req, res) => {
  const { clientId } = req.params;
  const { webhookUrl, webhookHeaders } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ error: "webhookUrl wajib diisi" });
  }
  // Cek kepemilikan client
  const clients = await getAllClients();
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
  const updated = await updateClientWebhook(
    clientId,
    webhookUrl,
    webhookHeaders
  );
  if (updated) {
    res.json({ status: "ok", clientId, webhookUrl, webhookHeaders });
  } else {
    res.status(500).json({ error: "Gagal update webhook client." });
  }
};

// Update/generate API key (token) client
exports.updateApiKey = async (req, res) => {
  const { clientId } = req.params;
  // Cek kepemilikan client
  const clients = await getAllClients();
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
  // Generate new token
  const newToken = crypto.randomBytes(32).toString("hex");
  const updated = await updateClientToken(clientId, newToken);
  if (updated) {
    res.json({ token: newToken });
  } else {
    res.status(500).json({ error: "Gagal update API key client." });
  }
};
