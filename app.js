require('dotenv').config(); // Chargement des variables d'environnement
const path = require('path');
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const uploadsRouter = require('./controllers/fileUpload.js');
const attribuerController = require('./controllers/attribuer.js');
const chargeDeStageController = require('./controllers/charge_de_stage');
const dossierController = require('./controllers/dossier');
const encadreurController = require('./controllers/encadreur.js');
const etudiantController = require('./controllers/etudiant');
const studentInfoNT = require('./pages/demandesNT.js');
const studentInfoActuel = require('./pages/stagiairesActuels.js');
const envoiMail = require('./pages/traitement.js'); // Assurez-vous que le chemin est correct
const dashboardRouter = require('./pages/acceuil.js');
const rapport = require('./pages/nouveauRapport.js');
const historiqueRapport = require('./pages/historiqueRapport.js');
const administrateur = require('./pages/signing.js');
const profil = require('./pages/profile.js');
const { profile } = require('console');


const app = express();

// Configuration de la connexion à la base de données
const connection = mysql.createConnection({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Établir la connexion à la base de données
connection.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
}); 

// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());

// Middleware CORS
app.use(cors());

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.send('Bienvenue sur la page d\'accueil INSBE');
});

// Définir la connexion comme une propriété de l'application
app.set('connection', connection);

app.use(express.json());
//Déclaration des routes

// Servir les fichiers statiques à partir du répertoire "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Route moi l'envoie de mail
app.use('/mail', envoiMail);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Routes pour les opérations liées à la table 'attribuer'
app.get('/attributions', (req, res) => attribuerController.getAll(connection, req, res));
app.get('/attributions/:matriculeCharge/:matriculeEncadreur', (req, res) => attribuerController.getByMatricules(connection, req, res));
app.post('/attributions', (req, res) => attribuerController.create(connection, req, res));
app.delete('/attributions/:matriculeCharge/:matriculeEncadreur', (req, res) => attribuerController.delete(connection, req, res));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Routes pour les opérations liées à la table 'charge_de_stage'
app.get('/charge_de_stage', (req, res) => chargeDeStageController.getAll(connection, req, res));
app.get('/charge_de_stage/:id', (req, res) => chargeDeStageController.getById(connection, req, res));
app.post('/charge_de_stage', (req, res) => chargeDeStageController.create(connection, req, res));
app.put('/charge_de_stage/:id', (req, res) => chargeDeStageController.update(connection, req, res));
app.delete('/charge_de_stage/:id', (req, res) => chargeDeStageController.delete(connection, req, res));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Routes pour les opérations liées à la table 'dossier'
app.get('/dossiers', (req, res) => dossierController.getAll(connection, req, res));
app.get('/dossiers/:id', (req, res) => dossierController.getById(connection, req, res));
app.post('/dossiers', (req, res) => dossierController.create(connection, req, res));
app.put('/dossiers/:id', (req, res) => dossierController.update(connection, req, res));
app.delete('/dossiers/:id', (req, res) => dossierController.delete(connection, req, res));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Routes pour les opérations liées à la table 'encadreur'
app.get('/encadreurs', (req, res) => encadreurController.getAll(connection, req, res));
app.get('/encadreurs/:id', (req, res) => encadreurController.getById(connection, req, res));
app.post('/encadreurs', (req, res) => encadreurController.create(connection, req, res));
app.put('/encadreurs/:id', (req, res) => encadreurController.update(connection, req, res));
app.delete('/encadreurs/:id', (req, res) => encadreurController.delete(connection, req, res));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Routes pour les opérations liées à la table 'etudiant'
app.get('/etudiants', (req, res) => etudiantController.getAll(connection, req, res));
app.get('/etudiants/:matricule', (req, res) => etudiantController.getByMatricule(connection, req, res));
app.post('/etudiants', (req, res) => etudiantController.create(connection, req, res));
app.put('/etudiants/:matricule', (req, res) => etudiantController.update(connection, req, res));
app.delete('/etudiants/:matricule', (req, res) => etudiantController.delete(connection, req, res));

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/demandesNT', (req, res) => studentInfoNT.getDemandesNT(connection, req, res));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/stagiaresActuel', (req, res) => studentInfoActuel.getStagiaresActuels(connection, req, res));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post('/profile', (req, res) => profil.getprofile(connection, req, res));
////////////////////////////////////////////////////////////////////////////////////////////
app.get('/stagiaresAccepte', (req, res) => studentInfoActuel.getStagiaresAccepte(connection, req, res));
app.put('/theme', (req, res) => studentInfoActuel.updateTheme(connection, req, res));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Route pour la page d'acceuil
app.use('/dashboard', dashboardRouter);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Route pour la page d'acceuil
app.post('/nouveaurapport', (req, res) => rapport.create(connection, req, res));
app.put('/updaterapport', (req, res) => rapport.update(connection, req, res));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Route pour les pages de connexions
app.post('/nouveauadmin', (req, res) => administrateur.create(connection, req, res));
app.post('/logadmin', (req, res) => administrateur.login(connection, req, res));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Routes pour la rubrique de la gestion rapports de stage
app.get('/historique', (req, res) => historiqueRapport.getHistorique(connection, req, res));
app.get('/historiquespeciaux', (req, res) => historiqueRapport.getHistoriqueSpeciaux(connection, req, res));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Routes pour recevoir le fichier upload

// Démarrer le serveur
app.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000');
});