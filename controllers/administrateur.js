// pages/signing.js - Version contextualisée pour Prisma
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

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('image');

// --- 1. CRÉATION D'UN ADMINISTRATEUR (SIGNUP) ---
exports.create = (req, res) => {
  // Utilisation de multer pour gérer l'upload
  upload(req, res, async (err) => {
    if (err) {
      console.error('Erreur Multer:', err);
      return res.status(400).json({ 
        error: err.message || 'Erreur lors du téléchargement de la photo' 
      });
    }

    const { matricule, firstName, lastName, email, password } = req.body;

    // Validation des champs
    if (!matricule || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis' 
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Format d\'email invalide' 
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    try {
      // Vérifier si l'email existe déjà
      const existingAdminByEmail = await req.prisma.administrateur.findFirst({
        where: { EMAILADMIN: email }
      });

      if (existingAdminByEmail) {
        return res.status(400).json({ 
          error: 'Cet email est déjà utilisé' 
        });
      }

      // Vérifier si le matricule existe déjà
      const existingAdminByMatricule = await req.prisma.administrateur.findFirst({
        where: { MATRICULEADMIN: matricule }
      });

      if (existingAdminByMatricule) {
        return res.status(400).json({ 
          error: 'Ce matricule est déjà utilisé' 
        });
      }

      // Hachage du mot de passe
      const hash = await bcrypt.hash(password, saltRounds);
      const photoName = req.file ? req.file.filename : 'default-avatar.png';

      // Création avec Prisma
      const nouvelAdmin = await req.prisma.administrateur.create({
        data: {
          MATRICULEADMIN: matricule,
          NOMADMIN: lastName,
          PRENOMADMIN: firstName,
          EMAILADMIN: email,
          PASSWARDADMIN: hash,
          PHOTOADMIN: photoName
        },
        select: {
          IDADMIN: true,
          MATRICULEADMIN: true,
          NOMADMIN: true,
          PRENOMADMIN: true,
          EMAILADMIN: true,
          PHOTOADMIN: true
        }
      });

      console.log('✅ Administrateur créé:', nouvelAdmin.EMAILADMIN);

      res.status(201).json({ 
        success: true,
        message: 'Administrateur créé avec succès',
        data: {
          id: nouvelAdmin.IDADMIN,
          matricule: nouvelAdmin.MATRICULEADMIN,
          nom: nouvelAdmin.NOMADMIN,
          prenom: nouvelAdmin.PRENOMADMIN,
          email: nouvelAdmin.EMAILADMIN,
          photo: nouvelAdmin.PHOTOADMIN
        }
      });
      
    } catch (error) {
      console.error('Erreur création administrateur:', error);
      
      // Gestion des erreurs Prisma
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          success: false,
          error: 'Ce matricule ou email existe déjà dans le système' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la création de l\'administrateur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// --- 2. CONNEXION (LOGIN) ---
// --- 2. CONNEXION (LOGIN) ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validation des champs
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'Adresse e-mail et mot de passe requis' 
    });
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Format d\'email invalide' 
    });
  }

  try {
    // 1. Chercher l'admin par email avec Prisma
    const admin = await req.prisma.administrateur.findFirst({
      where: { EMAILADMIN: email }
    });

    // 2. Vérifier si l'utilisateur existe
    if (!admin) {
      console.log(`❌ Tentative échouée pour: ${email}`);
      return res.status(401).json({ 
        success: false,
        error: 'Email ou mot de passe incorrect' 
      });
    }

    // 3. Comparer le mot de passe haché
    const match = await bcrypt.compare(password, admin.PASSWARDADMIN);

    if (!match) {
      console.log(`❌ Mot de passe incorrect pour: ${email}`);
      return res.status(401).json({ 
        success: false,
        error: 'Email ou mot de passe incorrect' 
      });
    }

    console.log('✅ Connexion établie pour:', admin.NOMADMIN, admin.PRENOMADMIN);

    // 4. Génération d'un Token JWT
    const token = jwt.sign(
      { 
        id: admin.IDADMIN,
        matricule: admin.MATRICULEADMIN, 
        email: admin.EMAILADMIN,
        role: 'administrateur'
      },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    // 5. Génération d'un refresh token (optionnel - mais ajoutez-le à la réponse si besoin)
    const refreshToken = jwt.sign(
      { 
        id: admin.IDADMIN,
        role: 'administrateur'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
      { expiresIn: '7d' }
    );

    // 6. Réponse structurée - CORRECTION ICI
    return res.json({
      success: true,
      message: 'Connexion réussie',
      // SUPPRIMEZ le niveau "data" et retournez directement token et user
      token: token, // <-- Directement à la racine
      user: {       // <-- Directement à la racine
        id: admin.IDADMIN,
        matricule: admin.MATRICULEADMIN,
        nom: admin.NOMADMIN,
        prenom: admin.PRENOMADMIN,
        email: admin.EMAILADMIN,
        photo: admin.PHOTOADMIN
      },
      refreshToken: refreshToken // Optionnel, ajoutez si vous voulez l'utiliser
    });
    
  } catch (error) {
    console.error('Erreur Serveur Login:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la connexion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// --- 3. RAFRAÎCHISSEMENT DE TOKEN ---
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      success: false,
      error: 'Token de rafraîchissement manquant' 
    });
  }

  try {
    // Vérifier le refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    // Vérifier que l'admin existe toujours
    const admin = await req.prisma.administrateur.findUnique({
      where: { IDADMIN: decoded.id },
      select: {
        IDADMIN: true,
        MATRICULEADMIN: true,
        EMAILADMIN: true,
        NOMADMIN: true,
        PRENOMADMIN: true
      }
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        error: 'Administrateur non trouvé' 
      });
    }

    // Générer un nouveau access token
    const newAccessToken = jwt.sign(
      { 
        id: admin.IDADMIN,
        matricule: admin.MATRICULEADMIN, 
        email: admin.EMAILADMIN,
        role: 'administrateur'
      },
      process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_complexe',
      { expiresIn: '10h' }
    );

    return res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        token: newAccessToken
      }
    });

  } catch (error) {
    console.error('Erreur refresh token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token expiré' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors du rafraîchissement du token' 
    });
  }
};

// --- 4. VÉRIFICATION DE TOKEN ---
exports.verifyToken = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({ 
      success: false,
      error: 'Token manquant' 
    });
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_complexe'
    );
    
    // Vérifier que l'admin existe toujours
    const admin = await req.prisma.administrateur.findUnique({
      where: { IDADMIN: decoded.id },
      select: {
        IDADMIN: true,
        MATRICULEADMIN: true,
        NOMADMIN: true,
        PRENOMADMIN: true,
        EMAILADMIN: true,
        PHOTOADMIN: true
      }
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        error: 'Administrateur non trouvé' 
      });
    }

    return res.json({
      success: true,
      message: 'Token valide',
      data: {
        valid: true,
        admin: admin,
        expiresIn: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expiré' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la vérification du token' 
    });
  }
};

// --- 5. MOT DE PASSE OUBLIÉ (RÉINITIALISATION) ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false,
      error: 'Email requis' 
    });
  }

  try {
    const admin = await req.prisma.administrateur.findFirst({
      where: { EMAILADMIN: email },
      select: { IDADMIN: true, EMAILADMIN: true, NOMADMIN: true, PRENOMADMIN: true }
    });

    if (!admin) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
      return res.json({
        success: true,
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { 
        id: admin.IDADMIN,
        email: admin.EMAILADMIN,
        type: 'password_reset'
      },
      process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_complexe',
      { expiresIn: '1h' }
    );

    // ICI: Envoyer l'email avec le lien de réinitialisation
    // Exemple: https://votredomaine.com/reset-password?token=${resetToken}
    
    console.log(`Token de réinitialisation pour ${email}: ${resetToken}`);

    // En production, vous enverriez un email
    // await sendResetEmail(admin.EMAILADMIN, resetToken, `${admin.NOMADMIN} ${admin.PRENOMADMIN}`);

    return res.json({
      success: true,
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation',
      // En développement seulement
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Erreur mot de passe oublié:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la demande de réinitialisation' 
    });
  }
};

// --- 6. RÉINITIALISATION DE MOT DE PASSE ---
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ 
      success: false,
      error: 'Token et nouveau mot de passe requis' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères' 
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_complexe'
    );

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ 
        success: false,
        error: 'Token invalide' 
      });
    }

    // Vérifier que l'admin existe
    const admin = await req.prisma.administrateur.findUnique({
      where: { IDADMIN: decoded.id }
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        error: 'Administrateur non trouvé' 
      });
    }

    // Hacher le nouveau mot de passe
    const hash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await req.prisma.administrateur.update({
      where: { IDADMIN: admin.IDADMIN },
      data: { PASSWARDADMIN: hash }
    });

    console.log(`✅ Mot de passe réinitialisé pour: ${admin.EMAILADMIN}`);

    return res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token invalide ou expiré' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expiré' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la réinitialisation du mot de passe' 
    });
  }
};

// --- 7. CHANGEMENT DE MOT DE PASSE (pour utilisateur connecté) ---
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false,
      error: 'Mot de passe actuel et nouveau mot de passe requis' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false,
      error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
    });
  }

  try {
    // Récupérer l'admin depuis req.admin (ajouté par authenticateToken)
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({ 
        success: false,
        error: 'Non authentifié' 
      });
    }

    // Récupérer l'admin avec le mot de passe
    const admin = await req.prisma.administrateur.findUnique({
      where: { IDADMIN: req.admin.id }
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        error: 'Administrateur non trouvé' 
      });
    }

    // Vérifier le mot de passe actuel
    const match = await bcrypt.compare(currentPassword, admin.PASSWARDADMIN);
    if (!match) {
      return res.status(401).json({ 
        success: false,
        error: 'Mot de passe actuel incorrect' 
      });
    }

    // Hacher le nouveau mot de passe
    const hash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await req.prisma.administrateur.update({
      where: { IDADMIN: admin.IDADMIN },
      data: { PASSWARDADMIN: hash }
    });

    console.log(`✅ Mot de passe changé pour: ${admin.EMAILADMIN}`);

    return res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors du changement de mot de passe' 
    });
  }
};