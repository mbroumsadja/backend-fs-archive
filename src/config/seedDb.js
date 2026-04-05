// src/config/seedDb.js
// Peuple la base avec des données de démarrage (filières, UEs, comptes de test)

require('dotenv').config();
const bcrypt    = require('bcryptjs');

// Import APRÈS dotenv.config() pour que process.env soit chargé
const { sequelize, Filiere, UE, Utilisateur } = require('../models');
const logger    = require('../utils/logger');

const seed = async () => {
  try {
    // Synchroniser les tables (crée les tables si elles n'existent pas)
    await sequelize.sync({ alter: true });
    logger.info('Tables synchronisées');

    // ── Filières ──────────────────────────────────────────────────
    const [infoFiliere] = await Filiere.findOrCreate({
      where: { code: 'INFO' },
      defaults: { nom: 'Informatique', departement: 'Sciences & Technologies' },
    });

    const [mathFiliere] = await Filiere.findOrCreate({
      where: { code: 'MATH' },
      defaults: { nom: 'Mathématiques', departement: 'Sciences Fondamentales' },
    });

    const [gcFiliere] = await Filiere.findOrCreate({
      where: { code: 'GC' },
      defaults: { nom: 'Génie Civil', departement: 'Ingénierie' },
    });

    logger.info('Filières créées ✓');

    // ── UEs Informatique ──────────────────────────────────────────
    const uesInfo = [
      { code: 'INFO101', intitule: 'Introduction à la programmation', niveau: 'L1', semestre: 'S1', credits: 4 },
      { code: 'INFO102', intitule: 'Architecture des ordinateurs',    niveau: 'L1', semestre: 'S2', credits: 3 },
      { code: 'INFO201', intitule: 'Structures de données',           niveau: 'L2', semestre: 'S3', credits: 4 },
      { code: 'INFO202', intitule: 'Bases de données',                niveau: 'L2', semestre: 'S4', credits: 4 },
      { code: 'INFO301', intitule: 'Algorithmique avancée',           niveau: 'L3', semestre: 'S5', credits: 4 },
      { code: 'INFO302', intitule: 'Réseaux informatiques',           niveau: 'L3', semestre: 'S6', credits: 3 },
      { code: 'INFO401', intitule: 'Génie Logiciel',                  niveau: 'M1', semestre: 'S7', credits: 4 },
      { code: 'INFO402', intitule: 'Intelligence Artificielle',       niveau: 'M1', semestre: 'S8', credits: 4 },
    ];

    for (const ue of uesInfo) {
      await UE.findOrCreate({ where: { code: ue.code, filiere_id: infoFiliere.id }, defaults: { ...ue, filiere_id: infoFiliere.id } });
    }

    // ── UEs Mathématiques ─────────────────────────────────────────
    const uesMath = [
      { code: 'MATH101', intitule: 'Analyse 1',               niveau: 'L1', semestre: 'S1', credits: 4 },
      { code: 'MATH102', intitule: 'Algèbre linéaire',        niveau: 'L1', semestre: 'S2', credits: 4 },
      { code: 'MATH201', intitule: 'Analyse 2',               niveau: 'L2', semestre: 'S3', credits: 4 },
      { code: 'MATH202', intitule: 'Probabilités & Stats',    niveau: 'L2', semestre: 'S4', credits: 3 },
    ];

    for (const ue of uesMath) {
      await UE.findOrCreate({ where: { code: ue.code, filiere_id: mathFiliere.id }, defaults: { ...ue, filiere_id: mathFiliere.id } });
    }

    logger.info('UEs créées ✓');

    // ── Comptes utilisateurs de test ──────────────────────────────
    // On utilise upsert pour forcer la mise à jour même si le compte existe déjà
    const hash = (pwd) => bcrypt.hash(pwd, 12);

    const upsertUser = async (matricule, defaults) => {
      const [user, created] = await Utilisateur.findOrCreate({ where: { matricule }, defaults });
      if (!created) {
        // Le compte existe déjà → on force la mise à jour du mot de passe et du statut
        await user.update({ password: defaults.password, statut: 'actif' });
        logger.info(`  Compte mis à jour : ${matricule}`);
      } else {
        logger.info(`  Compte créé : ${matricule}`);
      }
      return user;
    };

    // Admin
    await upsertUser('ADM-0001', {
      nom: 'Administrateur', prenom: 'Super',
      email:    'admin@uniportal.cm',
      password: await hash('Admin@1234'),
      role:     'admin',
      statut:   'actif',
    });

    // Enseignant INFO
    await upsertUser('ENS-0001', {
      nom: 'Mvondo', prenom: 'Henri',
      email:      'h.mvondo@uniportal.cm',
      password:   await hash('Ens@1234'),
      role:       'enseignant',
      statut:     'actif',
      filiere_id: infoFiliere.id,
    });

    // Enseignant MATH
    await upsertUser('ENS-0002', {
      nom: 'Etoga', prenom: 'Paul',
      email:      'p.etoga@uniportal.cm',
      password:   await hash('Ens@1234'),
      role:       'enseignant',
      statut:     'actif',
      filiere_id: mathFiliere.id,
    });

    // Étudiant INFO L2
    await upsertUser('22U0001', {
      nom: 'Mbarga', prenom: 'Aline',
      email:      'a.mbarga@etud.uniportal.cm',
      password:   await hash('22U0001'),
      role:       'etudiant',
      statut:     'actif',
      niveau:     'L2',
      filiere_id: infoFiliere.id,
    });

    // Étudiant MATH L1
    await upsertUser('23U0042', {
      nom: 'Nzinga', prenom: 'Boris',
      email:      'b.nzinga@etud.uniportal.cm',
      password:   await hash('23U0042'),
      role:       'etudiant',
      statut:     'actif',
      niveau:     'L1',
      filiere_id: mathFiliere.id,
    });

    logger.info('Utilisateurs de test créés ✓');
    logger.info('');
    logger.info('═══════════════════════════════════════════');
    logger.info('  Comptes de test :');
    logger.info('  Admin     → ADM-0001  / Admin@1234');
    logger.info('  Enseignant→ ENS-0001  / Ens@1234');
    logger.info('  Étudiant  → 22U0001   / 22U0001');
    logger.info('═══════════════════════════════════════════');

    await sequelize.close();
    process.exit(0);

  } catch (err) {
    logger.error('Erreur seed :', err);
    process.exit(1);
  }
};

seed();
