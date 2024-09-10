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
  { name: 'fichierRapport', maxCount: 1 },
]);

// Créer un nouveau rapport de stage
exports.create = (connection, req, res) => {
    handleFileUpload(req, res, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement des fichier :', err);
        res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
        return;
      }
  
      const { matriculeStagiaire,  commentaire, theme, fichierRapport} = req.body;
      const query = 'INSERT INTO rapport (MATRICULE, COMMENTAIRE, THEME, FICHIER) VALUES (?, ?, ?, ?)';
      
      connection.query(query, [
        matriculeStagiaire,
        commentaire,
        theme,
        req.files.fichierRapport ? req.files.fichierRapport[0].filename : null,
       
      ], (error, results) => {
        if (error) {
          console.error('Erreur lors de la création du rapport :', error);
          res.status(500).json({ error: 'Erreur lors de la création du rapport' });
          return;
        }
        res.json({ message: 'rapport créé avec succès' });
      });
    });
  };
 
  // modifier rapport de stage
exports.update = (connection, req, res) => {
  handleFileUpload(req, res, (err) => {
    if (err) {
      console.error('Erreur lors du téléchargement des fichiers :', err);
      res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
      return;
    }

    const { matriculeStagiaire, commentaire, theme, fichierRapport } = req.body;
    const querySelect = 'SELECT FICHIER FROM rapport WHERE MATRICULE = ?';

    // 1. Récupérer le nom de l'ancien fichier
    connection.query(querySelect, [matriculeStagiaire], (selectError, selectResults) => {
      if (selectError) {
        console.error('Erreur lors de la récupération de l\'ancien rapport :', selectError);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'ancien rapport' });
        return;
      }

      if (selectResults.length === 0) {
        res.status(404).json({ error: 'Aucun rapport trouvé pour ce matricule' });
        return;
      }

      const ancienFichier = selectResults[0].FICHIER;
      const cheminAncienFichier = path.join(__dirname, 'uploads', ancienFichier);

      // 2. Supprimer l'ancien rapport
      fs.unlink(cheminAncienFichier, (unlinkError) => {
        if (unlinkError) {
          console.error('Erreur lors de la suppression de l\'ancien fichier :', unlinkError);
          res.status(500).json({ error: 'Erreur lors de la suppression de l\'ancien fichier' });
          return;
        }

        // 3. Mettre à jour le rapport
        const queryUpdate = 'UPDATE rapport SET COMMENTAIRE = ?, THEME = ?, FICHIER = ? WHERE MATRICULE = ?';
        connection.query(queryUpdate, [
          commentaire,
          theme,
          req.files.fichierRapport ? req.files.fichierRapport[0].filename : null,
          matriculeStagiaire
        ], (updateError, updateResults) => {
          if (updateError) {
            console.error('Erreur lors de la mise à jour du rapport :', updateError);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du rapport' });
            return;
          }

          res.json({ message: 'Rapport mis à jour avec succès' });
        });
      });
    });
  });
};