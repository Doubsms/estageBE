const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const bcrypt = require('bcrypt'); // Ajout de bcrypt
const { Interface } = require('readline');
const router = express.Router();
const saltRounds = 10;

// Configuration de Multer pour le stockage des fichiers
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

// Middleware pour le téléchargement des fichiers
const handleFileUpload = upload.fields([
  { name: 'image', maxCount: 1 },
]);

// Créer un nouveau administrateur
exports.create = async (connection, req, res) => {
  handleFileUpload(req, res, async (err) => {
    if (err) {
      console.error('Erreur lors du téléchargement de la photo :', err);
      res.status(500).json({ error: 'Erreur lors du téléchargement de la photo' });
      return;
    }

    const { matricule, firstName, lastName, email, password } = req.body;

    // Crypter le mot de passe avec bcrypt
     bcrypt.hash(password, saltRounds, function(err, hash) {
      const query = 'INSERT INTO administrateur (MATRICULEADMIN, NOMADMIN, PRENOMADMIN, EMAILADMIN, PASSWARDADMIN, PHOTOADMIN) VALUES (?, ?, ?, ?, ?, ?)';
    
      connection.query(query, [
        matricule,
        firstName,
        lastName,
        email,
        hash, // Utiliser le mot de passe crypté
        req.files.image ? req.files.image[0].filename : null,
      ], (error, results) => {
        if (error) {
          console.error('Erreur lors de la création du rapport :', error);
          res.status(500).json({ error: 'Erreur lors de la création de l\'administrateur' });
          return;
        }
        res.json({ message: 'Administrateur créé avec succès' });
      });
  });

   
  });
};

// Vérification des informations de connexion
exports.login = (connection, req, res) => {

  async function checkUser(email, password) {
    // Vérifier si l'email et le mot de passe sont fournis
    if (!email || !password) {
      res.status(400).json({ error: 'Adresse e-mail et mot de passe requis' });
      return;
    }

    // Requête pour récupérer les informations de l'utilisateur
    const query = 'SELECT MATRICULEADMIN, NOMADMIN, PRENOMADMIN, EMAILADMIN, PASSWARDADMIN, PHOTOADMIN FROM administrateur WHERE EMAILADMIN = ?';

    // Exécution de la requête
    connection.query(query, [email], async (error, results) => {
      if (error) {
        console.error('Erreur lors de la connexion à l\'Interface administrateur :', error);
        res.status(500).json({ error: 'Erreur lors de la connexion à l\'Interface administrateur' });
        return;
      }

      // Vérifier si l'utilisateur est trouvé
      if (results.length === 0) {
        console.log('Informations de connexion invalides');
        res.status(401).json({ error: 'Informations de connexion invalides' });
        return;
      }

      // Comparer le mot de passe
      const match = await bcrypt.compare(password, results[0].PASSWARDADMIN);
      
      if (match) {
        // Connexion réussie
        console.log('Connexion établie !!!');
        res.json(results[0]);
      } else {
        // Mot de passe incorrect
        console.log('Erreur d\'authentification de mot de passe');
        res.status(401).json({ error: 'Informations de connexion invalides' });
      }
    });
  }

  // Appel de la fonction de vérification de l'utilisateur
  checkUser(req.body.email, req.body.password);
};