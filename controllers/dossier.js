const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration Multer (reste identique car Multer gère ses propres callbacks)
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

// Middleware pour les fichiers multiples
const handleFileUpload = upload.fields([
  { name: 'CNI', maxCount: 1 },
  { name: 'CERTIFICAT', maxCount: 1 },
  { name: 'LETTREMOTIVATION', maxCount: 1 },
  { name: 'LETTRERECOMMENDATION', maxCount: 1 },
  { name: 'PHOTOPROFIL', maxCount: 1 }
]);

// 1. Récupérer tous les dossiers
exports.getAll = async (pool, req, res) => {
  const query = 'SELECT * FROM dossier';
  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erreur SQL getAll dossiers:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' });
  }
};

// 2. Récupérer un dossier par ID
exports.getById = async (pool, req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM dossier WHERE NUMERODEDOSSIER = ?';
  try {
    const [results] = await pool.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Erreur SQL getById dossier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du dossier' });
  }
};

// 3. Créer un nouveau dossier (Multi-fichiers)
exports.create = async (pool, req, res) => {
  // Multer n'étant pas une promesse par défaut, on garde cette structure pour l'upload
  handleFileUpload(req, res, async (err) => {
    if (err) {
      console.error('Erreur Multer:', err);
      return res.status(500).json({ error: 'Erreur lors du téléchargement des fichiers' });
    }

    try {
      const { MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE } = req.body;
      const files = req.files || {};

      const query = `
        INSERT INTO dossier 
        (MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT, CNI, CERTIFICAT, LETTREMOTIVATION, LETTRERECOMMENDATION, PHOTOPROFIL) 
        VALUES (?, ?, ?, "non traité", ?, ?, ?, ?, ?)
      `;

      await pool.query(query, [
        MATRICULEETUDIANT,
        DATEDEBUTDESEANCE,
        DATEFINDESEANCE,
        files.CNI ? files.CNI[0].filename : null,
        files.CERTIFICAT ? files.CERTIFICAT[0].filename : null,
        files.LETTREMOTIVATION ? files.LETTREMOTIVATION[0].filename : null,
        files.LETTRERECOMMENDATION ? files.LETTRERECOMMENDATION[0].filename : null,
        files.PHOTOPROFIL ? files.PHOTOPROFIL[0].filename : null
      ]);

      res.json({ message: 'Dossier créé avec succès' });
    } catch (error) {
      console.error('Erreur SQL create dossier:', error);
      res.status(500).json({ error: 'Erreur lors de la création du dossier en base de données' });
    }
  });
};

// 4. Mettre à jour un dossier
exports.update = async (pool, req, res) => {
  const id = req.params.id;
  const { MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT } = req.body;
  const query = `
    UPDATE dossier 
    SET MATRICULEETUDIANT = ?, DATEDEBUTDESEANCE = ?, DATEFINDESEANCE = ?, ETAT = ? 
    WHERE NUMERODEDOSSIER = ?
  `;
  try {
    const [result] = await pool.query(query, [MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    res.json({ message: 'Dossier mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur SQL update dossier:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du dossier' });
  }
};

// 5. Supprimer un dossier
exports.delete = async (pool, req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM dossier WHERE NUMERODEDOSSIER = ?';
  try {
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    res.json({ message: 'Dossier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur SQL delete dossier:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du dossier' });
  }
};