require('dotenv').config(); 
const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import du middleware d'action logging
const actionLogger = require('./fonctionalites/actionLogger.js');

// Import du middleware d'authentification
const {authenticateToken} = require('./fonctionalites/authenticateToken.js');

// Import des contrôleurs
const attribuerController = require('./controllers/attribuer.js');
const chargeDeStageController = require('./controllers/charge_de_stage');
const dossierController = require('./controllers/dossier');
const encadreurController = require('./controllers/encadreur.js');
const etudiantController = require('./controllers/etudiant');
const studentInfoNT = require('./pages/demandesNT.js');
const studentInfoActuel = require('./pages/stagiairesActuels.js');
const envoiMail = require('./pages/traitement.js');
const dashboardRouter = require('./pages/acceuil.js');
const rapport = require('./pages/nouveauRapport.js');
const historiqueRapport = require('./pages/historiqueRapport.js');
const administrateur = require('./pages/signing.js');
const profil = require('./pages/profile.js');

const app = express();

// --- CONFIGURATION DE LA BASE DE DONNÉES (POOL) ---
let pool;

const initializePool = () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  return pool;
};

// Initialiser le pool
pool = initializePool();

// Fonction pour récupérer une connexion
const getConnection = async () => {
  return await pool.getConnection();
};

// Test de la connexion au démarrage
getConnection()
  .then(conn => {
    console.log('✅ Connecté à la base de données MySQL (INS BE)');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données :', err);
  });

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging d'actions (doit être après bodyParser mais avant les routes)
app.use(actionLogger);

// Définir le pool comme propriété globale
app.set('connection', pool);

// --- ROUTES PUBLIQUES (sans authentification) ---
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API E-Stage INS Cameroun');
});

// Route pour visualiser les logs (protégée)
app.get('/logs', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [logs] = await connection.execute(
      'SELECT * FROM logs_actions ORDER BY horodatage DESC LIMIT 100'
    );
    connection.release();
    res.json(logs);
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des logs' });
  }
});

// Authentification (routes publiques)
app.post('/nouveauadmin', authenticateToken, (req, res) => administrateur.create(pool, req, res));
app.post('/logadmin', (req, res) => administrateur.login(pool, req, res));

// Verification du Token (route publique)
app.get('/verify-token', authenticateToken, (req, res) => etudiantController.getAll(pool, req, res));

// --- ROUTES PROTÉGÉES (avec authentification JWT) ---

// Gestion des envois d'emails (protégé)
app.use('/mail', authenticateToken, envoiMail);

// --- ATTRIBUTIONS (protégé) ---
app.get('/attributions', authenticateToken, (req, res) => attribuerController.getAll(pool, req, res));
app.get('/attributions/:matriculeCharge/:matriculeEncadreur', authenticateToken, (req, res) => attribuerController.getByMatricules(pool, req, res));
app.post('/attributions', authenticateToken, (req, res) => attribuerController.create(pool, req, res));
app.delete('/attributions/:matriculeCharge/:matriculeEncadreur', authenticateToken, (req, res) => attribuerController.delete(pool, req, res));

// --- CHARGÉS DE STAGE (protégé) ---
app.get('/charge_de_stage', authenticateToken, (req, res) => chargeDeStageController.getAll(pool, req, res));
app.get('/charge_de_stage/:id', authenticateToken, (req, res) => chargeDeStageController.getById(pool, req, res));
app.post('/charge_de_stage', authenticateToken, (req, res) => chargeDeStageController.create(pool, req, res));
app.put('/charge_de_stage/:id', authenticateToken, (req, res) => chargeDeStageController.update(pool, req, res));
app.delete('/charge_de_stage/:id', authenticateToken, (req, res) => chargeDeStageController.delete(pool, req, res));

// --- DOSSIERS (protégé) ---
app.get('/dossiers', authenticateToken, (req, res) => dossierController.getAll(pool, req, res));
app.get('/dossiers/:id', authenticateToken, (req, res) => dossierController.getById(pool, req, res));
app.post('/dossiers', authenticateToken, (req, res) => dossierController.create(pool, req, res));
app.put('/dossiers/:id', authenticateToken, (req, res) => dossierController.update(pool, req, res));
app.delete('/dossiers/:id', authenticateToken, (req, res) => dossierController.delete(pool, req, res));

// --- ENCADREURS (protégé) ---
app.get('/encadreurs', authenticateToken, (req, res) => encadreurController.getAll(pool, req, res));
app.get('/encadreurs/:id', authenticateToken, (req, res) => encadreurController.getById(pool, req, res));
app.post('/encadreurs', authenticateToken, (req, res) => encadreurController.create(pool, req, res));
app.put('/encadreurs/:id', authenticateToken, (req, res) => encadreurController.update(pool, req, res));
app.delete('/encadreurs/:id', authenticateToken, (req, res) => encadreurController.delete(pool, req, res));

// --- ÉTUDIANTS (protégé) ---
app.get('/etudiants', authenticateToken, (req, res) => etudiantController.getAll(pool, req, res));
app.get('/etudiants/:matricule', authenticateToken, (req, res) => etudiantController.getByMatricule(pool, req, res));
app.post('/etudiants', authenticateToken, (req, res) => etudiantController.create(pool, req, res));
app.put('/etudiants/:matricule', authenticateToken, (req, res) => etudiantController.update(pool, req, res));
app.delete('/etudiants/:matricule', authenticateToken, (req, res) => etudiantController.delete(pool, req, res));

// --- GESTION DES STAGES & DASHBOARD (protégé) ---
app.get('/demandesNT', authenticateToken, (req, res) => studentInfoNT.getDemandesNT(pool, req, res));
app.get('/stagiaresActuel', authenticateToken, (req, res) => studentInfoActuel.getStagiaresActuels(pool, req, res));
app.get('/stagiaresAccepte', authenticateToken, (req, res) => studentInfoActuel.getStagiaresAccepte(pool, req, res));
app.put('/theme', authenticateToken, (req, res) => studentInfoActuel.updateTheme(pool, req, res));

// Dashboard (protégé)
app.use('/dashboard', authenticateToken, dashboardRouter);

// Profil (protégé)
app.post('/profile', authenticateToken, (req, res) => profil.getprofile(pool, req, res));

// --- RAPPORTS (protégé) ---
app.post('/nouveaurapport', authenticateToken, (req, res) => rapport.create(pool, req, res));
app.put('/updaterapport', authenticateToken, (req, res) => rapport.update(pool, req, res));
app.get('/historique', authenticateToken, (req, res) => historiqueRapport.getHistorique(pool, req, res));
app.get('/historiquespeciaux', authenticateToken, (req, res) => historiqueRapport.getHistoriqueSpeciaux(pool, req, res));

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔐 Mode d'authentification: JWT activé`);
  console.log(`📝 Logging d'actions activé (table: logs_actions)`);
});

// Exporter le pool pour les autres fichiers
module.exports = { pool, getConnection };