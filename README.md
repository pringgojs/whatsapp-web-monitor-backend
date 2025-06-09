# WhatsApp Web Monitoring Backend

Backend Node.js/Express untuk monitoring WhatsApp Web (whatsapp-web.js).

## Fitur Utama

- **Autentikasi JWT**: Login, register, proteksi endpoint
- **Manajemen Client WhatsApp**:
  - Tambah, hapus, edit, reconnect, scan QR, cek status, info client
  - Endpoint webhook per client (GET/POST /sessions/:clientId/webhook)
  - Endpoint info client (GET /sessions/:clientId/info)
  - Endpoint group (GET /sessions/:clientId/groups)
- **Pengiriman Pesan**: POST /messages (dengan validasi nomor & status client)
- **Webhook**: Simpan & ambil URL webhook per client (in-memory, siap migrasi DB)
- **Status & QR**: Endpoint status, QR code, polling status
- **Proteksi Role**: Hanya user dengan role tertentu bisa akses endpoint tertentu
- **Integrasi Penuh dengan Frontend**
- **Error Handling**: Semua endpoint mengembalikan error message yang jelas

## Instalasi & Menjalankan

1. `npm install`
2. Salin/atur file `.env` jika perlu (PORT, JWT_SECRET, dsb)
3. `npm run dev` atau `node src/app.js`

## Struktur Utama

- `src/routes/` - Semua endpoint utama (sessionRoutes, messageRoutes, authRoutes, apiClientRoutes)
- `src/clients/sessionManager.js` - Manajemen session WhatsApp
- `src/utils/waNumber.js` - Helper format nomor WhatsApp
- `src/models/userModel.js` - Model user (in-memory)

## Catatan

- Webhook per client saat ini disimpan in-memory (bisa diupgrade ke database)
- Pastikan frontend sudah mengarah ke API backend yang benar
- Semua endpoint sudah terintegrasi dengan frontend
