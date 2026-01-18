const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT pour les utilisateurs
 * Vérifie et valide le token JWT généré lors de la connexion
 * Gère les rôles: administrateur, encadreur, etudiant
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_complexe');
    
    console.log('✅ Token JWT valide pour:', decoded.email || decoded.matricule);
    console.log('📋 Données du token:', {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      matricule: decoded.matricule,
      exp: new Date(decoded.exp * 1000).toLocaleString(),
      iat: new Date(decoded.iat * 1000).toLocaleString()
    });

    // 3. RÉCUPÉRATION DU CLIENT PRISMA
    // On récupère le client Prisma ajouté dans le middleware
    const prisma = req.prisma;

    if (!prisma) {
      console.error("❌ Client Prisma non trouvé dans la requête");
      return res.status(500).json({ 
        error: "Erreur de configuration de la base de données" 
      });
    }

    // 4. Vérifier l'utilisateur selon son rôle
    let user = null;
    
    switch (decoded.role) {
      case 'administrateur':
        user = await prisma.administrateur.findFirst({
          where: {
            OR: [
              { IDADMIN: decoded.id },
              { MATRICULEADMIN: decoded.matricule },
              { EMAILADMIN: decoded.email }
            ]
          }
        });
        break;
        
      case 'encadreur':
        user = await prisma.encadreur.findFirst({
          where: {
            OR: [
              { IDENCADREUR: decoded.id },
              { MATRICULEENCADREUR: decoded.matricule }
            ]
          },
          include: {
            structure: {
              select: {
                IDSTRUCTURE: true,
                NOMSTRUCTURE: true,
                ABBREVIATION: true
              }
            }
          }
        });
        break;
        
      case 'etudiant':
        user = await prisma.etudiant.findUnique({
          where: { MATRICULEETUDIANT: decoded.matricule }
        });
        break;
        
      default:
        console.log(`❌ Rôle inconnu: ${decoded.role}`);
        return res.status(401).json({ 
          error: 'Rôle non reconnu',
          message: 'Le rôle spécifié dans le token n\'est pas valide'
        });
    }

    if (!user) {
      console.log(`❌ Utilisateur non trouvé pour le rôle ${decoded.role}`);
      return res.status(401).json({ 
        error: 'Accès révoqué',
        message: 'Utilisateur introuvable ou supprimé'
      });
    }

    // 5. Ajouter les informations de l'utilisateur à la requête
    switch (decoded.role) {
      case 'administrateur':
        req.admin = {
          id: user.IDADMIN,
          matricule: user.MATRICULEADMIN,
          nom: user.NOMADMIN,
          prenom: user.PRENOMADMIN,
          email: user.EMAILADMIN,
          photo: user.PHOTOADMIN,
          role: 'administrateur'
        };
        break;
        
      case 'encadreur':
        req.encadreur = {
          id: user.IDENCADREUR,
          matricule: user.MATRICULEENCADREUR,
          nom: user.NOMENCADREUR,
          prenom: user.PRENOMENCADREUR,
          poste: user.POSTE,
          structure: user.structure,
          role: 'encadreur'
        };
        break;
        
      case 'etudiant':
        req.etudiant = {
          matricule: user.MATRICULEETUDIANT,
          nom: user.NOMETUDIANT,
          prenom: user.PRENOMETUDIANT,
          email: user.EMAIL,
          etablissement: user.ETABLISSEMENT,
          filiere: user.FILIERE,
          niveau: user.NIVEAU,
          role: 'etudiant'
        };
        break;
    }

    // 6. Ajouter également les données décodées du token pour référence
    req.tokenData = decoded;
    req.userRole = decoded.role;

    console.log(`✅ Authentification réussie pour: ${user.NOMADMIN || user.NOMENCADREUR || user.NOMETUDIANT} 
      ${user.PRENOMADMIN || user.PRENOMENCADREUR || user.PRENOMETUDIANT} (${decoded.role})`);

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

    // Erreur de base de données Prisma
    if (error.code && error.code.startsWith('P')) {
      console.error('❌ Erreur Prisma:', error.code, error.message);
      return res.status(500).json({ 
        error: 'Erreur de base de données',
        message: 'Une erreur est survenue lors de la vérification des informations'
      });
    }

    // Erreur inattendue
    return res.status(500).json({ 
      error: 'Erreur d\'authentification',
      message: 'Une erreur interne est survenue lors de la vérification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Middleware pour vérifier des rôles spécifiques
 * @param {Array} roles - Tableau des rôles autorisés
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ 
        error: 'Non autorisé',
        message: 'Vous devez être authentifié pour accéder à cette ressource'
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Accès interdit',
        message: `Vous n'avez pas les permissions nécessaires. Rôles autorisés: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
 * (Pour les étudiants qui ne peuvent accéder qu'à leurs propres données)
 */
function authorizeOwnResource(model, idField = 'matricule') {
  return async (req, res, next) => {
    try {
      const userId = req.userRole === 'etudiant' 
        ? req.etudiant?.matricule 
        : req.userRole === 'encadreur' 
          ? req.encadreur?.id 
          : req.admin?.id;
      
      const resourceId = req.params[idField] || req.params.id;
      
      if (!userId || !resourceId) {
        return res.status(400).json({ 
          error: 'Paramètres manquants' 
        });
      }

      // Si l'utilisateur est admin, il a accès à tout
      if (req.userRole === 'administrateur') {
        return next();
      }

      // Pour les étudiants et encadreurs, vérifier s'ils sont propriétaires
      const resource = await req.prisma[model].findFirst({
        where: {
          [idField]: resourceId,
          ...(req.userRole === 'etudiant' && { MATRICULEETUDIANT: userId })
        }
      });

      if (!resource) {
        return res.status(403).json({ 
          error: 'Accès interdit',
          message: 'Vous n\'avez pas accès à cette ressource'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification propriétaire:', error);
      res.status(500).json({ 
        error: 'Erreur de vérification des permissions' 
      });
    }
  };
}

/**
 * Middleware pour vérifier les tokens de rafraîchissement
 */
async function authenticateRefreshToken(req, res, next) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      error: 'Token de rafraîchissement manquant' 
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    
    // Vérifier que le refresh token existe en base (si vous stockez les refresh tokens)
    // Implémentation optionnelle
    
    req.refreshTokenData = decoded;
    next();
  } catch (error) {
    console.error('Erreur vérification refresh token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Refresh token expiré',
        message: 'Veuillez vous reconnecter'
      });
    }
    
    res.status(401).json({ 
      error: 'Refresh token invalide' 
    });
  }
}

// Exportations
exports.authenticateToken = authenticateToken;
exports.authorizeRoles = authorizeRoles;
exports.authorizeOwnResource = authorizeOwnResource;
exports.authenticateRefreshToken = authenticateRefreshToken;