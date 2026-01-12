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

// Stockage global des requêtes SQL (simple et efficace)
const sqlQueriesMap = new Map();

const actionLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Générer un ID unique pour cette requête HTTP
  const httpRequestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  req._httpRequestId = httpRequestId;
  req._startTime = startTime;
  
  // Initialiser la liste des requêtes SQL pour cette requête HTTP
  sqlQueriesMap.set(httpRequestId, []);
  
  // Monkey patch pour intercepter les requêtes SQL
  patchConnectionPool(req.app.get('connection'), httpRequestId);
  
  // Variable pour éviter les logs multiples
  let isLogged = false;
  
  // Fonction de logging unique
  const logOnce = async () => {
    if (!isLogged) {
      isLogged = true;
      await logAction(req, res, startTime, httpRequestId);
      // Nettoyer après le log
      sqlQueriesMap.delete(httpRequestId);
    }
  };
  
  // Utiliser l'événement 'finish' qui ne se déclenche qu'une fois
  res.on('finish', async () => {
    await logOnce();
  });
  
  next();
};

// Fonction pour patcher le pool de connexions
function patchConnectionPool(pool, httpRequestId) {
  if (!pool || pool._patchedForRequest === httpRequestId) {
    return;
  }
  
  pool._patchedForRequest = httpRequestId;
  const originalGetConnection = pool.getConnection;
  
  pool.getConnection = async function() {
    const connection = await originalGetConnection.call(this);
    
    // Patcher execute()
    const originalExecute = connection.execute;
    connection.execute = function(sql, params, callback) {
      const startTime = Date.now();
      const sqlId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Capturer la requête SQL
      const sqlQueries = sqlQueriesMap.get(httpRequestId) || [];
      sqlQueries.push({
        id: sqlId,
        sql: sql,
        params: params,
        startTime: startTime,
        type: 'execute'
      });
      sqlQueriesMap.set(httpRequestId, sqlQueries);
      
    //   console.log(`📊 [SQL ${sqlId}] ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
      
      if (callback) {
        // Version avec callback
        return originalExecute.call(this, sql, params, (err, results, fields) => {
          const duration = Date.now() - startTime;
          updateSQLQuery(httpRequestId, sqlId, duration, err);
          callback(err, results, fields);
        });
      } else {
        // Version Promise
        return originalExecute.call(this, sql, params).then(([results, fields]) => {
          const duration = Date.now() - startTime;
          updateSQLQuery(httpRequestId, sqlId, duration, null);
          return [results, fields];
        }).catch(err => {
          const duration = Date.now() - startTime;
          updateSQLQuery(httpRequestId, sqlId, duration, err);
          throw err;
        });
      }
    };
    
    // Patcher query() aussi
    const originalQuery = connection.query;
    connection.query = function(sql, params, callback) {
      const startTime = Date.now();
      const sqlId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      const sqlQueries = sqlQueriesMap.get(httpRequestId) || [];
      sqlQueries.push({
        id: sqlId,
        sql: sql,
        params: params,
        startTime: startTime,
        type: 'query'
      });
      sqlQueriesMap.set(httpRequestId, sqlQueries);
      
    //   console.log(`📊 [SQL ${sqlId}] QUERY: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
      
      if (callback) {
        return originalQuery.call(this, sql, params, (err, results, fields) => {
          const duration = Date.now() - startTime;
          updateSQLQuery(httpRequestId, sqlId, duration, err);
          callback(err, results, fields);
        });
      } else {
        return originalQuery.call(this, sql, params).then(([results, fields]) => {
          const duration = Date.now() - startTime;
          updateSQLQuery(httpRequestId, sqlId, duration, null);
          return [results, fields];
        }).catch(err => {
          const duration = Date.now() - startTime;
          updateSQLQuery(httpRequestId, sqlId, duration, err);
          throw err;
        });
      }
    };
    
    return connection;
  };
}

// Fonction pour mettre à jour une requête SQL
function updateSQLQuery(httpRequestId, sqlId, duration, error) {
  const sqlQueries = sqlQueriesMap.get(httpRequestId);
  if (sqlQueries) {
    const sqlQuery = sqlQueries.find(q => q.id === sqlId);
    if (sqlQuery) {
      sqlQuery.duration = duration;
      sqlQuery.error = error ? error.message || String(error) : null;
      sqlQuery.completed = true;
    //   console.log(`   ⏱️  SQL ${sqlId}: ${duration}ms ${error ? '❌' : '✅'}`);
    }
  }
}

async function logAction(req, res, startTime, httpRequestId) {
  const duration = Date.now() - startTime;
  
  try {
    // Récupérer les informations de l'utilisateur depuis req.admin
    let userEmail = 'Anonymous';
    let userName = 'Anonymous';

    // console.log('=== LOG ACTION DEBUG ===');
    // console.log('req.admin exists?', !!req.admin);
    // console.log('Request URL:', req.originalUrl);
    
    if (req.admin) {
      // Utiliser req.admin comme vous l'avez spécifié
      userEmail = req.admin.email || req.admin.EMAILADMIN || 'Unknown';
      
      // Construire le nom complet
      if (req.admin.nom && req.admin.prenom) {
        userName = `${req.admin.nom} ${req.admin.prenom}`;
      } else if (req.admin.nom) {
        userName = req.admin.nom;
      } else if (req.admin.NOMADMIN && req.admin.PRENOMADMIN) {
        userName = `${req.admin.NOMADMIN} ${req.admin.PRENOMADMIN}`;
      } else if (req.admin.NOMADMIN) {
        userName = req.admin.NOMADMIN;
      } else {
        userName = 'Unknown';
      }
    } else if (req.originalUrl === '/logadmin' && req.body && req.body.email) {
      // Pour les tentatives de login
      userEmail = req.body.email;
      userName = 'Login attempt';
    }
    
    console.log('Extracted userEmail:', userEmail);
    console.log('Extracted userName:', userName);
    
    // Déterminer l'action en fonction de la route et de la méthode
    const action = determineAction(req.method, req.originalUrl);
    
    // Récupérer les requêtes SQL pour cette requête HTTP
    const sqlQueries = sqlQueriesMap.get(httpRequestId) || [];
    // console.log(`📊 ${sqlQueries.length} requêtes SQL capturées`);
    
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
      ['password', 'motDePasse', 'confirmPassword', 'oldPassword', 'newPassword'].forEach(field => {
        if (safeBody[field]) safeBody[field] = '***HIDDEN***';
      });
      logData.http_body = safeBody;
    }
    
    if (req.params && Object.keys(req.params).length > 0) {
      logData.http_params = req.params;
    }
    
    // 3. Requêtes SQL (LA PARTIE IMPORTANTE)
    if (sqlQueries.length > 0) {
      logData.sql_queries = sqlQueries.map(q => {
        // Nettoyer la requête SQL pour la sécurité
        let safeSql = q.sql;
        if (safeSql) {
          // Masquer les données sensibles
          safeSql = safeSql.replace(/VALUES\s*\([^)]+\)/gi, 'VALUES (***DATA***)');
          safeSql = safeSql.replace(/SET\s*[^WHERE]+/gi, 'SET ***DATA***');
          // Limiter la longueur
          if (safeSql.length > 500) {
            safeSql = safeSql.substring(0, 500) + '... [TRUNCATED]';
          }
        }
        
        return {
          type: q.type,
          sql_preview: safeSql,
          params_count: q.params ? (Array.isArray(q.params) ? q.params.length : 1) : 0,
          duration_ms: q.duration || null,
          error: q.error || null,
          completed: q.completed || false
        };
      });
      
      // Statistiques SQL
      logData.sql_stats = {
        total_queries: sqlQueries.length,
        completed_queries: sqlQueries.filter(q => q.completed).length,
        total_duration_ms: sqlQueries.reduce((sum, q) => sum + (q.duration || 0), 0),
        avg_duration_ms: sqlQueries.length > 0 ? 
          sqlQueries.reduce((sum, q) => sum + (q.duration || 0), 0) / sqlQueries.length : 0,
        has_errors: sqlQueries.some(q => q.error)
      };
    }
    
    // Convertir en JSON
    let requeteExecutee = null;
    try {
      requeteExecutee = JSON.stringify(logData, null, 2);
    //   console.log('✅ Données de log préparées avec succès');
    //   console.log(`   Taille: ${requeteExecutee.length} caractères`);
    //   console.log(`   Requêtes SQL incluses: ${sqlQueries.length}`);
    } catch (jsonError) {
      console.error('❌ Erreur de sérialisation JSON:', jsonError);
      requeteExecutee = JSON.stringify({
        error: 'json_serialization_failed', 
        http_request: {
          method: req.method,
          url: req.originalUrl
        },
        sql_queries_count: sqlQueries.length
      });
    }
    
    // console.log('=======================');
    
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
      response_time: duration,
      horodatage: new Date()
    };
    
    // Enregistrer dans la base de données
    await saveActionLog(req.app.get('connection'), logDataToSave);
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log:', error.message);
    // Ne pas bloquer l'application
  }
}

// Fonction pour déterminer l'action basée sur la route et la méthode
function determineAction(method, url) {
  // Extraire le chemin de base
  const path = url.split('?')[0];
  
  // Mapper les routes aux actions
  const routeActions = {
    // Authentification
    '/logadmin': 'Connexion administrateur',
    '/verify-token': 'Vérification token',
    
    // Demandes de stage
    '/demandesNT': 'Consultation demandes non traitées',
    '/stagiaresActuel': 'Consultation stagiaires actuels',
    '/stagiaresAccepte': 'Consultation stagiaires acceptés',
    
    // Dashboard
    '/dashboard': 'Accès dashboard',
    
    // Profil
    '/profile': 'Consultation profil',
    
    // Rapports
    '/nouveaurapport': 'Création rapport',
    '/updaterapport': 'Mise à jour rapport',
    '/historique': 'Consultation historique rapports',
    '/historiquespeciaux': 'Consultation rapports spéciaux',
    
    // Gestion des données
    '/etudiants': 'Gestion étudiants',
    '/encadreurs': 'Gestion encadreurs',
    '/charge_de_stage': 'Gestion chargés de stage',
    '/attributions': 'Gestion attributions',
    '/dossiers': 'Gestion dossiers',
    
    // Email
    '/mail': 'Envoi email',
    
    // Logs
    '/logs': 'Consultation logs'
  };
  
  // Chercher l'action correspondante
  for (const [route, action] of Object.entries(routeActions)) {
    if (path.includes(route)) {
      return `${getMethodAction(method)} ${action}`;
    }
  }
  
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

// Fonction pour sauvegarder le log dans la base de données
async function saveActionLog(pool, logData) {
  let connection;
  try {
    // Récupérer une connexion depuis le pool
    connection = await pool.getConnection();
    
    const query = `
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      logData.user_email,
      logData.user_name,
      logData.action,
      logData.methode_http,
      logData.endpoint,
      logData.requete_executee,
      logData.ip_address,
      logData.user_agent,
      logData.status_code,
      logData.horodatage
    ];
    
    await connection.execute(query, values);
    // console.log(`📝 Log d'action sauvegardé pour ${logData.user_name} (${logData.user_email})`);
    // console.log(`   Action: ${logData.action}`);
    // console.log(`   Taille requête_exécutée: ${logData.requete_executee ? logData.requete_executee.length : 0} caractères`);
    connection.release();
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du log:', error.message);
    
    // Libérer la connexion si elle existe
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Erreur lors de la libération de la connexion:', releaseError);
      }
    }
    
    // Log dans un fichier en cas d'échec de la base de données
    try {
      const logsDir = ensureLogsDirectory();
      const logEntry = `[${new Date().toISOString()}] Échec log DB: ${JSON.stringify({
        user: logData.user_name,
        action: logData.action,
        endpoint: logData.endpoint,
        error: error.message,
        sql_queries_included: logData.requete_executee && logData.requete_executee.includes('sql_queries') ? 'YES' : 'NO'
      })}\n`;
      fs.appendFileSync(path.join(logsDir, 'action_logs_fallback.log'), logEntry);
      console.log('Log sauvegardé dans le fichier de secours');
    } catch (fileError) {
      console.error('Échec de la sauvegarde dans le fichier:', fileError);
    }
  }
}

module.exports = actionLogger;