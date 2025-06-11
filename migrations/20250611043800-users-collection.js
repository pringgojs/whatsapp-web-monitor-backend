module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Membuat collection 'users' dengan index unik pada email dan username
    await db.createCollection("users");
    await db.collection("users").createIndex({ id: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    // Field: id, name, email, username, created_at, password, role
    // (Sudah termasuk index unik pada id, email, username)
    // Note: created_at harus di-set aplikasi saat insert (karena MongoDB tidak support default value di migration)
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Menghapus collection 'users'
    await db.collection("users").drop();
  },
};
