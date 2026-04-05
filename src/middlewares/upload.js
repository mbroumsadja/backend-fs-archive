// src/middlewares/upload.js
// Configuration Multer pour l'upload de fichiers (cours, sujets)

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { error } = require('../utils/apiResponse');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Stockage sur disque avec organisation par type ──────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organiser les fichiers : /uploads/cours/ ou /uploads/sujets/
    const subFolder = req.uploadFolder || 'divers';
    const dest = path.join(uploadDir, subFolder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },

  filename: (req, file, cb) => {
    // Nom unique pour éviter les collisions : timestamp + random + extension
    const ext      = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')   // Sécurité : pas de caractères spéciaux
      .toLowerCase()
      .slice(0, 50);
    const unique   = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${baseName}_${unique}${ext}`);
  },
});

// ── Filtre : types de fichiers autorisés ────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'video/mp4', 'video/webm',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : PDF, MP4, PPTX, DOCX'), false);
  }
};

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB) || 50;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

// Wrapper pour gérer les erreurs Multer proprement dans Express
const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, `Fichier trop volumineux. Maximum : ${maxSizeMB}MB`, 400);
      }
      return error(res, `Erreur upload : ${err.message}`, 400);
    }
    if (err) return error(res, err.message, 400);
    next();
  });
};

module.exports = { upload, handleUploadError };
