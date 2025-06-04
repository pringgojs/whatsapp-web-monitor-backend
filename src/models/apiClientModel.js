const apiClients = []; // sementara in-memory

function registerApiClient({ name, token, ownerId }) {
  const client = { id: Date.now().toString(), name, token, ownerId };
  apiClients.push(client);
  return client;
}

function findClientByToken(token) {
  return apiClients.find((c) => c.token === token);
}

function getAllClients() {
  return apiClients;
}

module.exports = { registerApiClient, findClientByToken, getAllClients };
