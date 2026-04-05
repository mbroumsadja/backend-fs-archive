// src/config/database.js
// Connexion Sequelize avec pool de connexions pour la montée en charge

const { Sequelize } = require('sequelize');
const logger        = require('../utils/logger');

const sequelize = new Sequelize(
  {
    dialect: 'sqlite',
    storage:"./database.sqlite",

    // ── Pool de connexions ──────────────────────────────────────────────
    // Essentiel pour la scalabilité : évite de créer une connexion
    // par requête, réutilise des connexions existantes.
    pool: {
      max:     parseInt(process.env.DB_POOL_MAX)  || 10,  // max connexions simultanées
      min:     parseInt(process.env.DB_POOL_MIN)  || 2,   // connexions maintenues ouvertes
      acquire: 30000, // ms avant timeout "impossible d'acquérir une connexion"
      idle:    parseInt(process.env.DB_POOL_IDLE) || 10000, // ms avant libération d'une connexion inactive
    },

    // ── Performance ────────────────────────────────────────────────────
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => logger.debug(sql)
      : false,

    define: {
      timestamps:  true,       // createdAt, updatedAt automatiques
      underscored: true,       // snake_case en base → camelCase dans le code
      freezeTableName: false,  // Sequelize peut pluraliser les noms de tables
    },

    dialectOptions: {
      // Nécessaire si MySQL >= 8 avec caching_sha2_password
      // authPlugins: { mysql_clear_password: () => () => Buffer.from('') },
      connectTimeout: 20000,
    },
  }
);

// Test de connexion au démarrage
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅  Connexion MySQL établie avec succès');
  } catch (err) {
    logger.error('❌  Impossible de se connecter à MySQL :', err.message);
    process.exit(1); // On arrête le serveur si la DB est inaccessible
  }
};

module.exports = { sequelize, connectDB };
