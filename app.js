// app.js - Version avec routes de base
require('dotenv').config(); 
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// IMPORT PRISMA
const prisma = require('./prisma/client');

// Import du middleware d'action logging
const actionLogger = require('./fonctionalites/actionLogger.js');

// Import du middleware d'authentification
const { authenticateToken } = require('./fonctionalites/authenticateToken.js');

// Import des contrôleurs Prisma (à créer)
const { testPrisma } = require('./controllers/test-prisma.js');

//Import des autres contrôleurs
const administrateurController = require('./controllers/administrateur');
const dashboardRouter = require('./pages/dashboard');
const etudiantController = require('./controllers/etudiant');
const dossierController = require('./controllers/dossier');
const structuresController = require('./controllers/structures.js');
const rapportController = require('./controllers/rapport.js');
const affectationController = require('./controllers/affectation.js');
const demmandesNT = require('./pages/demandesNonTraite.js');
const demmandesAcceptees = require('./pages/demandesAcceptees.js');
const stagiairesActuels = require('./pages/stagiairesActuels.js');
const traitementDemande = require('./pages/traitement.js');
const envoiMail = require('./fonctionalites/mail.js');
const historiqueRapports = require('./pages/historiqueRapport.js');
const encadreurController = require('./controllers/encadreur');
const profileController = require('./pages/profile.js');
const lettreAcceptationController = require('./pages/lettreacceptation.js');
const testmail = require('./fonctionalites/testmail.js');


const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MIDDLEWARE POUR AJOUTER PRISMA À REQ
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Middleware de logging d'actions
app.use(actionLogger);

// Gestion des envois d'emails (protégé)
app.use('/mail', (req, res) => envoiMail.sendEmail(req, res));


// --- ROUTES PUBLIQUES (sans authentification) ---
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API E-Stage INS Cameroun avec Prisma ORM');
});

app.get('/test-prisma', testPrisma);

// --- ROUTES PROTÉGÉES (avec authentification JWT) ---

// Route pour visualiser les logs
app.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await req.prisma.logs_actions.findMany({
      orderBy: { horodatage: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des logs' });
  }
});

// Routes pour administrateur
app.post('/login', (req, res) => administrateurController.login(req, res));
app.post('/refresh-token', (req, res) => administrateurController.refreshToken(req, res));
app.post('/verify-token', (req, res) => administrateurController.verifyToken(req, res));
app.post('/forgot-password', (req, res) => administrateurController.forgotPassword(req, res));
app.post('/reset-password', (req, res) => administrateurController.resetPassword(req, res));
app.post('/change-password', authenticateToken, (req, res) => administrateurController.changePassword(req, res));
app.post('/administrateurs', authenticateToken, (req, res) => administrateurController.create(req, res));

// Dashboard (protégé)
app.use('/dashboard',  dashboardRouter);

// ---- TEST D'ENVOI D'EMAIL ----
app.post('/test-email', (req, res) => testmail.sendEmail(req, res));
app.post('/accuse-reception-dossier', (req, res) => envoiMail.sendAccuseReceptionDossier(req, res));

// --- ÉTUDIANTS (protégé) ---
app.post('/etudiants', (req, res) => etudiantController.create(req, res));

// --- DOSSIERS (protégé) ---
app.post('/dossiers', (req, res) => dossierController.create(req, res));
app.get('/dossiers', authenticateToken,(req, res) => dossierController.getAll(req, res));

// --- PAGES DES DEMANDES (protégé) ---
app.get('/demandesNT', authenticateToken, (req, res) => demmandesNT.getDemandesNT(req, res));
app.get('/demandesAcceptees', authenticateToken,  (req, res) => demmandesAcceptees.getStagiaresAccepte(req, res));
app.get('/stagiairesActuels',  authenticateToken, (req, res) => stagiairesActuels.getStagiaresActuels(req, res));
app.put('/updatetheme',  authenticateToken, (req, res) => stagiairesActuels.updateTheme(req, res));

// --- STRUCTURES et Encadreurs de chaque structure (protégé) ---
app.get('/structures',  authenticateToken, (req, res) => structuresController.getAll(req, res));
// --- Atribution des Encadreurs aux stagiares et heritage de structures (protégé) ---
app.post('/traitement', authenticateToken, (req, res) => traitementDemande.affectation(req, res));

// --- Archivage Lettre d'acceptation et envoie de mail d'acceptation (protégé) ---

app.get('/lettreAcceptation', authenticateToken, (req, res) => lettreAcceptationController.getAll(req, res));
app.get('/lettreAcceptation/:id', authenticateToken, (req, res) => lettreAcceptationController.getById(req, res));
app.post('/lettreAcceptation', authenticateToken, (req, res) => lettreAcceptationController.create(req, res));
app.put('/lettreAcceptation/:id', authenticateToken, (req, res) => lettreAcceptationController.update(req, res));
app.delete('/lettreAcceptation/:id', authenticateToken, (req, res) => lettreAcceptationController.delete(req, res));
app.get('/lettreAcceptation/dossier/:idDossier', authenticateToken, (req, res) => lettreAcceptationController.getByDossier(req, res));
app.get('/lettreAcceptation/:id/download', authenticateToken, (req, res) => lettreAcceptationController.downloadLettreAcceptation(req, res));
app.get('/lettreAcceptation/check/:idDossier', authenticateToken, (req, res) => lettreAcceptationController.checkByDossier(req, res));
app.post('/lettreAcceptation/:id/renvoyer-email', authenticateToken, (req, res) => lettreAcceptationController.renvoyerEmail(req, res));

// --- Archivage de Rapports (protégé) ---
app.post('/rapport', authenticateToken, (req, res) => rapportController.create(req, res));
app.get('/rapport', authenticateToken, (req, res) => rapportController.getAll(req, res));
app.get('/historiqueRapportsSpeciaux', authenticateToken, (req, res) => historiqueRapports.getHistoriqueSpeciaux(req, res));
app.get('/historiqueRapports', authenticateToken, (req, res) => historiqueRapports.getHistorique(req, res));
app.put('/rapport/:id', authenticateToken, (req, res) => rapportController.update(req, res));

// --- Gestion Encadreurs (protégé) ---
app.get('/encadreurs', (req, res) => encadreurController.getAll(req, res));
app.post('/encadreurs', authenticateToken, (req, res) => encadreurController.create(req, res));

// --- Profil Administrateur (protégé) ---
app.post('/profile', authenticateToken, (req, res) => profileController.getprofile(req, res));

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔐 Mode d'authentification: JWT activé`);
  console.log(`📝 Logging d'actions activé`);
  console.log(`⚡ Prisma ORM configuré - Base: ${process.env.DB_NAME}`);
});

// Nettoyage à la fermeture
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('👋 Connexion Prisma fermée');
  process.exit(0);
});

module.exports = { app, prisma };