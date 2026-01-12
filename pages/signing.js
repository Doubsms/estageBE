const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const saltRounds = 10;

// --- CONFIGURATION DE STOCKAGE DES PHOTOS ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage }).single('image');

// --- 1. CRÉATION D'UN ADMINISTRATEUR (SIGNUP) ---
exports.create = (pool, req, res) => {
  // Utilisation de multer pour gérer l'upload
  upload(req, res, async (err) => {
    if (err) {
      console.error('Erreur Multer:', err);
      return res.status(500).json({ error: 'Erreur lors du téléchargement de la photo' });
    }

    const { matricule, firstName, lastName, email, password } = req.body;

    try {
      // Hachage du mot de passe
      const hash = await bcrypt.hash(password, saltRounds);
      const photoName = req.file ? req.file.filename : null;

      // Requête SQL (Notez l'utilisation de pool.execute ou pool.query)
      const query = `
        INSERT INTO administrateur 
        (MATRICULEADMIN, NOMADMIN, PRENOMADMIN, EMAILADMIN, PASSWARDADMIN, PHOTOADMIN) 
        VALUES (?, ?, ?, ?, ?, ?)`;

      await pool.query(query, [
        matricule,
        lastName,
        firstName,
        email,
        hash,
        photoName
      ]);

      res.status(201).json({ message: 'Administrateur créé avec succès' });
    } catch (error) {
      console.error('Erreur de création:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'administrateur' });
    }
  });
};

// --- 2. CONNEXION (LOGIN) ---
exports.login = async (pool, req, res) => {
  const { email, password } = req.body;

  // Validation des champs (correspond au frontend React)
  if (!email || !password) {
    return res.status(400).json({ error: 'Adresse e-mail et mot de passe requis' });
  }

  try {
    // 1. Chercher l'admin par email (EMAILADMIN)
    const query = 'SELECT * FROM administrateur WHERE EMAILADMIN = ?';
    const [results] = await pool.query(query, [email]);

    // 2. Vérifier si l'utilisateur existe
    if (results.length === 0) {
      console.log(`Tentative échouée pour : ${email}`);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const admin = results[0];

    // 3. Comparer le mot de passe haché (PASSWARDADMIN)
    const match = await bcrypt.compare(password, admin.PASSWARDADMIN);

    if (match) {
      console.log('✅ Connexion établie pour:', admin.NOMADMIN, admin.PRENOMADMIN);
      console.log('✅ E_mail:', admin.EMAILADMIN);

      // 4. Génération d'un Token JWT (Optionnel mais recommandé pour la sécurité)
      const token = jwt.sign(
        { id: admin.MATRICULEADMIN, email: admin.EMAILADMIN },
        process.env.JWT_SECRET, // Assurez-vous d'avoir JWT_SECRET dans votre .env
        { expiresIn: '10h' }
      );

      // Affichage du token pour le debug (à retirer en production)
      console.log('Token JWT généré:', token);

      // 5. Réponse structurée pour le frontend
      return res.json({
        message: 'Connexion réussie',
        token: token,
        user: {
          matricule: admin.MATRICULEADMIN,
          nom: admin.NOMADMIN,
          prenom: admin.PRENOMADMIN,
          email: admin.EMAILADMIN,
          photo: admin.PHOTOADMIN
        }
      });
    } else {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
  } catch (error) {
    console.error('Erreur Serveur Login:', error);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};