const { connectDb } = require("../config/db");
const { ObjectId } = require("mongodb");

async function getUserById(id) {
  const db = await connectDb();
  return db.collection("users").findOne({ id });
}

async function getUserByUsername(username) {
  const db = await connectDb();
  return db.collection("users").findOne({ username });
}

async function getUserByEmail(email) {
  const db = await connectDb();
  return db.collection("users").findOne({ email });
}

async function createUser(user) {
  const db = await connectDb();
  user.created_at = new Date();
  await db.collection("users").insertOne(user);
  return user;
}

async function getAllUsers() {
  const db = await connectDb();
  return db.collection("users").find({}).toArray();
}

module.exports = {
  getUserById,
  getUserByUsername,
  getUserByEmail,
  createUser,
  getAllUsers,
};
