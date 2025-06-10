const apiClients = []; // sementara in-memory

function registerApiClient({ id, name, token, ownerId }) {
  // Gunakan id dari parameter jika ada, jika tidak pakai Date.now()
  const clientId = id || Date.now().toString();
  const client = { id: clientId, name, token, ownerId };
  console.log("Registering API client:", client);
  apiClients.push(client);
  return client;
}

function findClientByToken(token) {
  return apiClients.find((c) => c.token === token);
}

function getAllClients() {
  return apiClients;
}

function deleteClientById(clientId) {
  const idx = apiClients.findIndex((c) => c.id === clientId);
  if (idx !== -1) {
    apiClients.splice(idx, 1);
    return true;
  }
  return false;
}

module.exports = {
  registerApiClient,
  findClientByToken,
  getAllClients,
  deleteClientById,
};
