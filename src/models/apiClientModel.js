const { connectDb } = require("../config/db");
const { ObjectId } = require("mongodb");

async function getAllClients() {
  const db = await connectDb();
  return db.collection("clients").find({}).toArray();
}

async function findClientByToken(token) {
  const db = await connectDb();
  return db.collection("clients").findOne({ token });
}

async function registerApiClient({ id, name, token, ownerId, webhookUrl }) {
  const db = await connectDb();
  const client = {
    id,
    name,
    token,
    ownerId,
    webhookUrl: webhookUrl || null,
    created_at: new Date(),
  };
  await db.collection("clients").insertOne(client);
  return client;
}

async function deleteClientById(clientId) {
  const db = await connectDb();
  const result = await db.collection("clients").deleteOne({ id: clientId });
  return result.deletedCount > 0;
}

// Update webhookUrl dan webhookHeaders client
async function updateClientWebhook(id, webhookUrl, webhookHeaders) {
  const db = await connectDb();
  const update = { webhookUrl };
  if (webhookHeaders !== undefined) update.webhookHeaders = webhookHeaders;
  const result = await db
    .collection("clients")
    .updateOne({ id }, { $set: update });
  return result.modifiedCount > 0;
}

// Update/generate API key (token) client
async function updateClientToken(id, token) {
  const db = await connectDb();
  const result = await db
    .collection("clients")
    .updateOne({ id }, { $set: { token } });
  return result.modifiedCount > 0;
}

module.exports = {
  registerApiClient,
  findClientByToken,
  getAllClients,
  deleteClientById,
  updateClientWebhook,
  updateClientToken,
};
