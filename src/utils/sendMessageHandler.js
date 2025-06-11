// Utility untuk handle pengiriman pesan WhatsApp
// Bisa dipakai di endpoint internal (JWT) maupun eksternal (API key)

const { formatWaNumber } = require("../utils/waNumber");

async function sendMessageHandler(session, to, message, res) {
  if (!session)
    return res.status(404).json({ error: "Client session not found" });

  if (!/^62\d{8,15}$/.test(to)) {
    return res
      .status(400)
      .json({ error: "Nomor tujuan harus format 62xxxxxxxxxxx dan valid." });
  }

  // Format nomor tujuan
  const waNumber = formatWaNumber(to);
  if (!waNumber) {
    return res.status(400).json({ error: "Nomor tujuan tidak valid." });
  }

  // Cek apakah nomor terdaftar di WhatsApp
  const isRegistered = await session.isRegisteredUser(waNumber);
  if (!isRegistered) {
    return res
      .status(400)
      .json({ error: "Nomor tidak terdaftar di WhatsApp." });
  }

  try {
    const sent = await session.sendMessage(waNumber, message);
    return res.json({ status: "Message sent", id: sent.id.id });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to send message", detail: err.message });
  }
}

module.exports = { sendMessageHandler };
