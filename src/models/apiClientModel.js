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

async function registerApiClient({
  id,
  name,
  token,
  ownerId,
  user_id,
  created_by,
}) {
  const db = await connectDb();
  const client = {
    id,
    name,
    token,
    ownerId,
    user_id,
    created_by,
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

module.exports = {
  registerApiClient,
  findClientByToken,
  getAllClients,
  deleteClientById,
};
