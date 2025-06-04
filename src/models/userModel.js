const users = []; // sementara di-memory

function createUser({ email, passwordHash, role }) {
  const user = { id: Date.now().toString(), email, passwordHash, role };
  users.push(user);
  return user;
}

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function getAllUsers() {
  return users;
}

module.exports = { createUser, findUserByEmail, getAllUsers };
