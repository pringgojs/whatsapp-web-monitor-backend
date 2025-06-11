module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Membuat collection 'clients' dengan index unik pada 'id' dan 'token'
    await db.createCollection("clients");
    await db.collection("clients").createIndex({ id: 1 }, { unique: true });
    await db.collection("clients").createIndex({ token: 1 }, { unique: true });
    await db.collection("clients").createIndex({ ownerId: 1 });
    // Tambahkan index pada user_id (relasi ke users)
    await db.collection("clients").createIndex({ user_id: 1 });
    // Tambahkan field created_at pada semua dokumen baru (gunakan validator agar default di aplikasi)
    // MongoDB tidak punya default value di migration, jadi pastikan aplikasi set created_at saat insert
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Menghapus collection 'clients'
    await db.collection("clients").drop();
  },
};
