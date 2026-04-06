// src/config/database.js
// Connexion Sequelize avec pool de connexions pour la montée en charge

const { Sequelize } = require('sequelize');
const logger        = require('../utils/logger');

const sequelize = new Sequelize(process.env.DB_URL,
  {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Obligatoire pour Render en mode SSL
      },
      connectTimeout: 20000, // Timeout de connexion
    },
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
  }
);

// Test de connexion au démarrage
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅  Connexion PostgreSQL établie avec succès');
  } catch (err) {
    logger.error('❌  Impossible de se connecter à PostgreSQL :', err.message);
    process.exit(1); // On arrête le serveur si la DB est inaccessible
  }
};

module.exports = { sequelize, connectDB };
