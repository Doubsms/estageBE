const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT pour les administrateurs
 * Vérifie et valide le token JWT généré lors de la connexion
 */
async function authenticateToken(req, res, next) {
  // 1. Récupération du token depuis l'en-tête Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    console.log('❌ Aucun token JWT fourni dans la requête');
    return res.status(401).json({ 
      error: 'Accès non autorisé',
      message: 'Token d\'authentification manquant'
    });
  }

  console.log('🔐 Token JWT reçu:', token.substring(0, 20) + '...'); 

  try {
    // 2. Vérification du token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Token JWT valide pour:', decoded.email);
    console.log('📋 Données du token:', {
      id: decoded.id,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000).toLocaleString(),
      iat: new Date(decoded.iat * 1000).toLocaleString()
    });

    // 3. RÉCUPÉRATION DU POOL DE CONNEXION
    // On récupère le pool que vous avez défini dans app.js avec app.set('connection', pool)
    const pool = req.app.get('connection');

    if (!pool) {
      console.error("❌ Pool de connexion non trouvé dans l'application");
      return res.status(500).json({ error: "Erreur de configuration de la base de données" });
    }

    // 4. Vérifier que l'administrateur existe toujours en base de données
    const query = 'SELECT * FROM administrateur WHERE MATRICULEADMIN = ? AND EMAILADMIN = ?';
    const [results] = await pool.query(query, [decoded.id, decoded.email]);

    if (results.length === 0) {
      console.log(`❌ Administrateur non trouvé: ${decoded.email}`);
      return res.status(401).json({ 
        error: 'Accès révoqué',
        message: 'Administrateur introuvable ou supprimé'
      });
    }

    const admin = results[0];

    // 5. Ajouter les informations de l'administrateur à la requête
    req.admin = {
      id: admin.MATRICULEADMIN,
      matricule: admin.MATRICULEADMIN,
      nom: admin.NOMADMIN,
      prenom: admin.PRENOMADMIN,
      email: admin.EMAILADMIN,
      photo: admin.PHOTOADMIN,
    };

    // 6. Ajouter également les données décodées du token pour référence
    req.tokenData = decoded;

    console.log(`✅ Authentification réussie pour: ${admin.NOMADMIN} ${admin.PRENOMADMIN}`);

    // 7. Passer au middleware suivant
    next();

  } catch (error) {
    console.error('❌ Erreur de vérification du token:', error.name, '-', error.message);

    // Gestion des différents types d'erreurs JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        message: 'Le token JWT est mal formé ou corrompu'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter',
        expiredAt: new Date(error.expiredAt).toLocaleString()
      });
    }

    // Erreur inattendue (ReferenceError, etc.)
    return res.status(500).json({ 
      error: 'Erreur d\'authentification',
      message: 'Une erreur interne est survenue lors de la vérification'
    });
  }
}

// Exportation correcte du middleware
exports.authenticateToken = authenticateToken;