// Koneksi MongoDB global untuk aplikasi backend
const { MongoClient } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGO_DB || "whatsappwebjs_explore";

let db = null;

async function connectDb() {
  if (db) return db;
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

module.exports = { connectDb };
