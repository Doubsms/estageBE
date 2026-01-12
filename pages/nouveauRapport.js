const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises; // Utilisation de la version Promise de fs

// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const handleFileUpload = upload.fields([{ name: 'fichierRapport', maxCount: 1 }]);

// --- 1. CRÉER UN NOUVEAU RAPPORT ---
exports.create = async (pool, req, res) => {
  // Utilisation de la fonction d'upload (Multer n'est pas nativement Promise-based)
  upload.fields([{ name: 'fichierRapport', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      console.error('Erreur Multer:', err);
      return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
    }

    try {
      const { matriculeStagiaire, commentaire, theme } = req.body;
      const filename = req.files.fichierRapport ? req.files.fichierRapport[0].filename : null;

      const query = 'INSERT INTO rapport (MATRICULE, COMMENTAIRE, THEME, FICHIER) VALUES (?, ?, ?, ?)';
      await pool.query(query, [matriculeStagiaire, commentaire, theme, filename]);

      res.json({ message: 'Rapport créé avec succès' });
    } catch (error) {
      console.error('Erreur SQL Create Rapport:', error);
      res.status(500).json({ error: 'Erreur lors de la création du rapport' });
    }
  });
};

// --- 2. MODIFIER UN RAPPORT (AVEC SUPPRESSION DE L'ANCIEN FICHIER) ---
exports.update = async (pool, req, res) => {
  upload.fields([{ name: 'fichierRapport', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      console.error('Erreur Multer:', err);
      return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
    }

    const { matriculeStagiaire, commentaire, theme } = req.body;

    try {
      // 1. Récupérer l'ancien nom de fichier en base de données
      const [rows] = await pool.query('SELECT FICHIER FROM rapport WHERE MATRICULE = ?', [matriculeStagiaire]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Aucun rapport trouvé pour ce matricule' });
      }

      const ancienFichier = rows[0].FICHIER;

      // 2. Si un nouveau fichier est téléchargé, on tente de supprimer l'ancien du serveur
      if (req.files.fichierRapport && ancienFichier) {
        // Construction du chemin (attention au dossier parent si ce fichier est dans /controllers)
        const cheminAncienFichier = path.join(__dirname, '..', 'uploads', ancienFichier);
        
        try {
          await fs.unlink(cheminAncienFichier);
          console.log(`Ancien fichier supprimé : ${ancienFichier}`);
        } catch (unlinkError) {
          // On logge l'erreur mais on ne bloque pas la mise à jour SQL
          console.warn('Le fichier physique n’existait peut-être plus sur le disque.');
        }
      }

      // 3. Mettre à jour les données en base de données
      const nouveauFichier = req.files.fichierRapport ? req.files.fichierRapport[0].filename : ancienFichier;
      
      const queryUpdate = 'UPDATE rapport SET COMMENTAIRE = ?, THEME = ?, FICHIER = ? WHERE MATRICULE = ?';
      await pool.query(queryUpdate, [commentaire, theme, nouveauFichier, matriculeStagiaire]);

      res.json({ message: 'Rapport mis à jour avec succès' });

    } catch (error) {
      console.error('Erreur SQL Update Rapport:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du rapport' });
    }
  });
};