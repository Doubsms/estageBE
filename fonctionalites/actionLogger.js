// middlewares/actionLogger.js
const fs = require('fs');
const path = require('path');

// S'assurer que le dossier logs existe
const ensureLogsDirectory = () => {
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
};

// Stockage global des requêtes Prisma (simple et efficace)
const prismaQueriesMap = new Map();

const actionLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Générer un ID unique pour cette requête HTTP
  const httpRequestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  req._httpRequestId = httpRequestId;
  req._startTime = startTime;
  
  // Initialiser la liste des requêtes Prisma pour cette requête HTTP
  prismaQueriesMap.set(httpRequestId, []);
  
  // Monkey patch pour intercepter les requêtes Prisma
  patchPrismaClient(req.prisma, httpRequestId);
  
  // Variable pour éviter les logs multiples
  let isLogged = false;
  
  // Fonction de logging unique
  const logOnce = async () => {
    if (!isLogged) {
      isLogged = true;
      await logAction(req, res, startTime, httpRequestId);
      // Nettoyer après le log
      prismaQueriesMap.delete(httpRequestId);
    }
  };
  
  // Utiliser l'événement 'finish' qui ne se déclenche qu'une fois
  res.on('finish', async () => {
    await logOnce();
  });
  
  next();
};

// Fonction pour patcher le client Prisma
function patchPrismaClient(prisma, httpRequestId) {
  if (!prisma || prisma._patchedForRequest === httpRequestId) {
    return;
  }
  
  prisma._patchedForRequest = httpRequestId;
  
  // Patcher $queryRaw
  const originalQueryRaw = prisma.$queryRaw;
  prisma.$queryRaw = function() {
    const startTime = Date.now();
    const queryId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const args = Array.from(arguments);
    
    // Capturer la requête SQL
    const prismaQueries = prismaQueriesMap.get(httpRequestId) || [];
    prismaQueries.push({
      id: queryId,
      type: '$queryRaw',
      args: args,
      startTime: startTime
    });
    prismaQueriesMap.set(httpRequestId, prismaQueries);
    
    // Exécuter la requête originale
    return originalQueryRaw.apply(this, args)
      .then(result => {
        const duration = Date.now() - startTime;
        updatePrismaQuery(httpRequestId, queryId, duration, null, result);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        updatePrismaQuery(httpRequestId, queryId, duration, error);
        throw error;
      });
  };
  
  // Patcher $executeRaw
  const originalExecuteRaw = prisma.$executeRaw;
  prisma.$executeRaw = function() {
    const startTime = Date.now();
    const queryId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const args = Array.from(arguments);
    
    const prismaQueries = prismaQueriesMap.get(httpRequestId) || [];
    prismaQueries.push({
      id: queryId,
      type: '$executeRaw',
      args: args,
      startTime: startTime
    });
    prismaQueriesMap.set(httpRequestId, prismaQueries);
    
    return originalExecuteRaw.apply(this, args)
      .then(result => {
        const duration = Date.now() - startTime;
        updatePrismaQuery(httpRequestId, queryId, duration, null, result);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        updatePrismaQuery(httpRequestId, queryId, duration, error);
        throw error;
      });
  };
  
  // Patcher les méthodes de modèle (findMany, findUnique, create, update, delete, etc.)
  patchPrismaModels(prisma, httpRequestId);
}

// Fonction pour patcher tous les modèles Prisma
function patchPrismaModels(prisma, httpRequestId) {
  // Obtenir tous les noms de modèles (ceux qui ne commencent pas par $)
  const modelNames = Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'));
  
  modelNames.forEach(modelName => {
    const model = prisma[modelName];
    
    // Patcher les méthodes principales
    const methods = ['findMany', 'findUnique', 'findFirst', 'create', 'update', 'delete', 'count', 'groupBy'];
    
    methods.forEach(method => {
      if (typeof model[method] === 'function') {
        const originalMethod = model[method];
        model[method] = function() {
          const startTime = Date.now();
          const queryId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
          const args = Array.from(arguments);
          
          const prismaQueries = prismaQueriesMap.get(httpRequestId) || [];
          prismaQueries.push({
            id: queryId,
            model: modelName,
            method: method,
            args: args,
            startTime: startTime
          });
          prismaQueriesMap.set(httpRequestId, prismaQueries);
          
          return originalMethod.apply(this, args)
            .then(result => {
              const duration = Date.now() - startTime;
              updatePrismaQuery(httpRequestId, queryId, duration, null, result);
              return result;
            })
            .catch(error => {
              const duration = Date.now() - startTime;
              updatePrismaQuery(httpRequestId, queryId, duration, error);
              throw error;
            });
        };
      }
    });
  });
}

// Fonction pour mettre à jour une requête Prisma
function updatePrismaQuery(httpRequestId, queryId, duration, error, result = null) {
  const prismaQueries = prismaQueriesMap.get(httpRequestId);
  if (prismaQueries) {
    const prismaQuery = prismaQueries.find(q => q.id === queryId);
    if (prismaQuery) {
      prismaQuery.duration = duration;
      prismaQuery.error = error ? error.message || String(error) : null;
      prismaQuery.completed = true;
      prismaQuery.resultType = result ? (Array.isArray(result) ? 'array' : typeof result) : null;
      prismaQuery.resultCount = result ? (Array.isArray(result) ? result.length : 1) : 0;
    }
  }
}

async function logAction(req, res, startTime, httpRequestId) {
  const duration = Date.now() - startTime;
  
  try {
    // Récupérer les informations de l'utilisateur
    let userEmail = 'Anonymous';
    let userName = 'Anonymous';

    // Pour les requêtes authentifiées avec JWT
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_tres_long_et_complexe');
          
          if (decoded.email) userEmail = decoded.email;
          if (decoded.nom && decoded.prenom) {
            userName = `${decoded.nom} ${decoded.prenom}`;
          } else if (decoded.matricule) {
            userName = decoded.matricule;
          }
        } catch (jwtError) {
          // Token invalide, on garde les valeurs par défaut
        }
      }
    }
    
    // Pour les requêtes POST de login
    if (req.originalUrl === '/login' && req.body && req.body.email) {
      userEmail = req.body.email;
      userName = 'Login attempt';
    }
    
    // Déterminer l'action en fonction de la route et de la méthode
    const action = determineAction(req.method, req.originalUrl);
    
    // Récupérer les requêtes Prisma pour cette requête HTTP
    const prismaQueries = prismaQueriesMap.get(httpRequestId) || [];
    
    // Construire l'objet de log
    const logData = {};
    
    // 1. Informations HTTP de base
    logData.http_request = {
      method: req.method,
      url: req.originalUrl,
      duration_ms: duration,
      status_code: res.statusCode
    };
    
    // 2. Paramètres HTTP
    if (req.query && Object.keys(req.query).length > 0) {
      logData.http_query = req.query;
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body };
      ['password', 'motDePasse', 'confirmPassword', 'oldPassword', 'newPassword', 'PASSWARDADMIN'].forEach(field => {
        if (safeBody[field]) safeBody[field] = '***HIDDEN***';
      });
      logData.http_body = safeBody;
    }
    
    if (req.params && Object.keys(req.params).length > 0) {
      logData.http_params = req.params;
    }
    
    // 3. Requêtes Prisma
    if (prismaQueries.length > 0) {
      logData.prisma_queries = prismaQueries.map(q => {
        // Formater les arguments pour la sécurité
        let argsPreview = '';
        if (q.args && q.args.length > 0) {
          try {
            const argsStr = JSON.stringify(q.args, (key, value) => {
              // Masquer les données sensibles
              if (key && (key.toLowerCase().includes('password') || 
                         key.toLowerCase().includes('pass') || 
                         key === 'PASSWARDADMIN')) {
                return '***HIDDEN***';
              }
              return value;
            });
            
            // Limiter la longueur
            if (argsStr.length > 200) {
              argsPreview = argsStr.substring(0, 200) + '... [TRUNCATED]';
            } else {
              argsPreview = argsStr;
            }
          } catch (e) {
            argsPreview = '[Cannot stringify args]';
          }
        }
        
        return {
          model: q.model || 'raw',
          method: q.method || q.type,
          args_preview: argsPreview,
          duration_ms: q.duration || null,
          error: q.error || null,
          completed: q.completed || false,
          result_type: q.resultType || null,
          result_count: q.resultCount || 0
        };
      });
      
      // Statistiques Prisma
      logData.prisma_stats = {
        total_queries: prismaQueries.length,
        completed_queries: prismaQueries.filter(q => q.completed).length,
        total_duration_ms: prismaQueries.reduce((sum, q) => sum + (q.duration || 0), 0),
        avg_duration_ms: prismaQueries.length > 0 ? 
          prismaQueries.reduce((sum, q) => sum + (q.duration || 0), 0) / prismaQueries.length : 0,
        has_errors: prismaQueries.some(q => q.error),
        models_used: [...new Set(prismaQueries.map(q => q.model).filter(Boolean))]
      };
    }
    
    // Convertir en JSON
    let requeteExecutee = null;
    try {
      requeteExecutee = JSON.stringify(logData, null, 2);
    } catch (jsonError) {
      console.error('❌ Erreur de sérialisation JSON:', jsonError);
      requeteExecutee = JSON.stringify({
        error: 'json_serialization_failed', 
        http_request: {
          method: req.method,
          url: req.originalUrl
        },
        prisma_queries_count: prismaQueries.length
      });
    }
    
    // Récupérer l'IP réelle
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.ip || 
                     req.connection.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Préparer les données du log
    const logDataToSave = {
      user_email: userEmail.substring(0, 255),
      user_name: userName.substring(0, 255),
      action: action.substring(0, 255),
      methode_http: req.method,
      endpoint: req.originalUrl.substring(0, 500),
      requete_executee: requeteExecutee,
      ip_address: ipAddress ? ipAddress.substring(0, 45) : null,
      user_agent: req.headers['user-agent'] || null,
      status_code: res.statusCode,
      horodatage: new Date()
    };
    
    // Enregistrer dans la base de données via Prisma
    await saveActionLog(req.prisma, logDataToSave);
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log:', error.message);
    // Log de secours dans un fichier
    try {
      const logsDir = ensureLogsDirectory();
      const logEntry = `[${new Date().toISOString()}] Échec log DB: ${error.message} - URL: ${req.originalUrl}\n`;
      fs.appendFileSync(path.join(logsDir, 'prisma_logs_fallback.log'), logEntry);
    } catch (fileError) {
      console.error('Échec de la sauvegarde dans le fichier:', fileError);
    }
  }
}

// Fonction pour déterminer l'action basée sur la route et la méthode
function determineAction(method, url) {
  // Extraire le chemin de base
  const path = url.split('?')[0];
  
  // Mapper les routes aux actions
  const routeActions = {
    // Authentification
    '/login': 'Connexion administrateur',
    '/verify-token': 'Vérification token',
    
    // Administrateurs
    '/administrateurs': 'Gestion administrateurs',
    
    // Étudiants
    '/etudiants': 'Gestion étudiants',
    
    // Encadreurs
    '/encadreurs': 'Gestion encadreurs',
    
    // Structures
    '/structures': 'Gestion structures',
    
    // Dossiers
    '/dossiers': 'Gestion dossiers',
    
    // Affectations
    '/affectations': 'Gestion affectations',
    
    // Rapports
    '/rapports': 'Gestion rapports',
    
    // Dashboard
    '/dashboard': 'Accès dashboard',
    
    // Logs
    '/logs': 'Consultation logs',
    
    // Test
    '/test-prisma': 'Test Prisma'
  };
  
  // Chercher l'action correspondante
  for (const [route, action] of Object.entries(routeActions)) {
    if (path.startsWith(route)) {
      return `${getMethodAction(method)} ${action}`;
    }
  }
  
  // Vérifier les routes avec paramètres
  if (path.match(/^\/etudiants\/[^\/]+$/)) return 'Consultation étudiant';
  if (path.match(/^\/administrateurs\/[^\/]+$/)) return 'Consultation administrateur';
  if (path.match(/^\/encadreurs\/[^\/]+$/)) return 'Consultation encadreur';
  if (path.match(/^\/structures\/[^\/]+$/)) return 'Consultation structure';
  if (path.match(/^\/dossiers\/[^\/]+$/)) return 'Consultation dossier';
  if (path.match(/^\/rapports\/[^\/]+$/)) return 'Consultation rapport';
  
  // Par défaut, utiliser le chemin
  return `${getMethodAction(method)} ${path}`;
}

// Fonction pour traduire la méthode HTTP en action
function getMethodAction(method) {
  const actions = {
    'GET': 'Consultation',
    'POST': 'Création',
    'PUT': 'Mise à jour',
    'PATCH': 'Modification',
    'DELETE': 'Suppression'
  };
  
  return actions[method] || method;
}

// Fonction pour sauvegarder le log dans la base de données via Prisma
async function saveActionLog(prisma, logData) {
  try {
    // Utiliser Prisma pour insérer le log
    await prisma.logs_actions.create({
      data: {
        user_email: logData.user_email,
        user_name: logData.user_name,
        action: logData.action,
        methode_http: logData.methode_http,
        endpoint: logData.endpoint,
        requete_executee: logData.requete_executee,
        ip_address: logData.ip_address,
        user_agent: logData.user_agent,
        status_code: logData.status_code,
        horodatage: logData.horodatage
      }
    });
    
    // Log de débogage (optionnel)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Log d'action sauvegardé pour ${logData.user_name} (${logData.user_email})`);
      console.log(`   Action: ${logData.action}`);
      console.log(`   Taille requête_exécutée: ${logData.requete_executee ? logData.requete_executee.length : 0} caractères`);
    }
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du log via Prisma:', error.message);
    
    // Log dans un fichier en cas d'échec
    try {
      const logsDir = ensureLogsDirectory();
      const logEntry = `[${new Date().toISOString()}] Échec log Prisma: ${JSON.stringify({
        user: logData.user_name,
        action: logData.action,
        endpoint: logData.endpoint,
        error: error.message
      })}\n`;
      fs.appendFileSync(path.join(logsDir, 'prisma_action_logs_fallback.log'), logEntry);
    } catch (fileError) {
      console.error('Échec de la sauvegarde dans le fichier:', fileError);
    }
    
    // Tentative alternative avec query raw si Prisma échoue
    try {
      if (logData.requete_executee && logData.requete_executee.length > 10000) {
        // Tronquer si trop long
        logData.requete_executee = logData.requete_executee.substring(0, 10000) + '... [TRUNCATED]';
      }
      
      await prisma.$executeRaw`
        INSERT INTO logs_actions (
          user_email, 
          user_name, 
          action, 
          methode_http, 
          endpoint, 
          requete_executee, 
          ip_address, 
          user_agent, 
          status_code,
          horodatage
        ) VALUES (
          ${logData.user_email},
          ${logData.user_name},
          ${logData.action},
          ${logData.methode_http},
          ${logData.endpoint},
          ${logData.requete_executee},
          ${logData.ip_address},
          ${logData.user_agent},
          ${logData.status_code},
          ${logData.horodatage}
        )
      `;
      
      console.log('Log sauvegardé avec $executeRaw');
    } catch (rawError) {
      console.error('Échec même avec $executeRaw:', rawError.message);
    }
  }
}

module.exports = actionLogger;