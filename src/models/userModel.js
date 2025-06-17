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
  // Tambahkan id unik string jika belum ada
  if (!user.id) {
    user.id = new ObjectId().toString();
  }
  await db.collection("users").insertOne(user);
  return user;
}

async function getAllUsers() {
  const db = await connectDb();
  return db.collection("users").find({}).toArray();
}

async function addIdToUsersWithoutId() {
  const db = await connectDb();
  const users = await db
    .collection("users")
    .find({
      $or: [{ id: { $exists: false } }, { id: null }, { id: "" }],
    })
    .toArray();
  for (const user of users) {
    await db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { id: user._id.toString() } });
  }
}

module.exports = {
  getUserById,
  getUserByUsername,
  getUserByEmail,
  createUser,
  getAllUsers,
  addIdToUsersWithoutId,
};
