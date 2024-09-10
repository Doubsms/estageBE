const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Importation de la fonction uuid
const fs = require('fs');
const router = express.Router();

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec UUID et conserver l'extension d'origine
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName); 
  }
});

const upload = multer({ storage });

// Middleware pour le téléchargement des fichiers
const handleFileUpload = upload.fields([
  { name: 'CNI', maxCount: 1 },
  { name: 'CERTIFICAT', maxCount: 1 },
  { name: 'LETTREMOTIVATION', maxCount: 1 },
  { name: 'LETTRERECOMMENDATION', maxCount: 1 },
  { name: 'PHOTOPROFIL', maxCount: 1 }
]);

// Récupérer tous les dossiers
exports.getAll = (connection, req, res) => {
  const query = 'SELECT * FROM dossier';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des dossiers :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' });
      return;
    }
    res.json(results);
  });
};

// Récupérer un dossier par son ID
exports.getById = (connection, req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM dossier WHERE NUMERODEDOSSIER = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération du dossier :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du dossier' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Dossier non trouvé' });
      return;
    }
    res.json(results[0]);
  });
};

// Créer un nouveau dossier
exports.create = (connection, req, res) => {
  handleFileUpload(req, res, (err) => {
    if (err) {
      console.error('Erreur lors du téléchargement des fichiers :', err);
      res.status(500).json({ error: 'Erreur lors du téléchargement des fichiers' });
      return;
    }

    const { MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT } = req.body;
    const query = 'INSERT INTO dossier (MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT, CNI, CERTIFICAT, LETTREMOTIVATION, LETTRERECOMMENDATION, PHOTOPROFIL) VALUES (?, ?, ?, "non traité", ?, ?, ?, ?, ?)';
    
    connection.query(query, [
      MATRICULEETUDIANT,
      DATEDEBUTDESEANCE,
      DATEFINDESEANCE,
      req.files.CNI ? req.files.CNI[0].filename : null,
      req.files.CERTIFICAT ? req.files.CERTIFICAT[0].filename : null,
      req.files.LETTREMOTIVATION ? req.files.LETTREMOTIVATION[0].filename : null,
      req.files.LETTRERECOMMENDATION ? req.files.LETTRERECOMMENDATION[0].filename : null,
      req.files.PHOTOPROFIL ? req.files.PHOTOPROFIL[0].filename : null
    ], (error, results) => {
      if (error) {
        console.error('Erreur lors de la création du dossier :', error);
        res.status(500).json({ error: 'Erreur lors de la création du dossier' });
        return;
      }
      res.json({ message: 'Dossier créé avec succès' });
    });
  });
};

// Mettre à jour un dossier
exports.update = (connection, req, res) => {
  const id = req.params.id;
  const { MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT } = req.body;
  const query = 'UPDATE dossier SET MATRICULEETUDIANT = ?, DATEDEBUTDESEANCE = ?, DATEFINDESEANCE = ?, ETAT = ? WHERE NUMERODEDOSSIER = ?';
  connection.query(query, [MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT, id], (error, results) => {
    if (error) {
      console.error('Erreur lors de la mise à jour du dossier :', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du dossier' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Dossier non trouvé' });
      return;
    }
    res.json({ message: 'Dossier mis à jour avec succès' });
  });
};

// Supprimer un dossier
exports.delete = (connection, req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM dossier WHERE NUMERODEDOSSIER = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Erreur lors de la suppression du dossier :', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du dossier' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Dossier non trouvé' });
      return;
    }
    res.json({ message: 'Dossier supprimé avec succès' });
  });
};
