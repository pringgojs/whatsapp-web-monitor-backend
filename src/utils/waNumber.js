// Helper untuk format nomor WhatsApp menjadi 62xxxxxxx@c.us
function formatWaNumber(input) {
  // Ambil hanya digit angka
  let num = String(input).replace(/\D/g, "");
  // Pastikan diawali 62
  if (num.startsWith("0")) num = "62" + num.slice(1);
  if (!num.startsWith("62")) num = "62" + num;
  // Hapus leading 0 setelah 62 (misal 6208... jadi 628...)
  num = num.replace(/^620+/, "62");
  // Panjang minimal 10 digit setelah 62
  if (num.length < 10) return null;
  return num + "@c.us";
}

module.exports = { formatWaNumber };
