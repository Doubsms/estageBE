const express = require('express');
const mysql = require('mysql');
const router = express.Router();

// Endpoint to fetch dashboard data
router.get('/dashboard-data', (req, res) => {
  const connection = req.app.get('connection'); // Assurez-vous que la connexion est définie dans app.js

  // Query to get the count of accepted internships (currentInterns)
  const acceptedInternshipsQuery = `
    SELECT COUNT(*) AS currentInterns
    FROM dossier
    WHERE etat = 'accepté'
  `;

  // Query to get the count of pending internship requests (pendingRequests)
  const pendingRequestsQuery = `
    SELECT COUNT(*) AS pendingRequests
    FROM dossier
    WHERE etat = 'non traité'
  `;

  // Query to get the total number of students (totalStaff)
  const totalStaffQuery = `
    SELECT COUNT(*) AS totalStaff
    FROM etudiant
  `;

  // Execute the queries and send the data to the client
  connection.query(acceptedInternshipsQuery, (err, acceptedInternshipsResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching data' });
    }

    connection.query(pendingRequestsQuery, (err, pendingRequestsResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching data' });
      }

      connection.query(totalStaffQuery, (err, totalStaffResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error fetching data' });
        }

        const data = {
          currentInterns: acceptedInternshipsResult[0].currentInterns,
          pendingRequests: pendingRequestsResult[0].pendingRequests,
          totalStaff: totalStaffResult[0].totalStaff
        };

        res.json(data);
      });
    });
  });
});

// Endpoint to fetch dashboard data
router.get('/dashboardgraphic', (req, res) => {
    const connection = req.app.get('connection'); // Assurez-vous que la connexion est définie dans app.js
  
    const getDemandesPerMonth = (req, res) => {
      connection.query(`
        SELECT 
          DATE_FORMAT(date, '%b') AS name,
          COUNT(*) AS demandes
        FROM 
          etudiant
        WHERE 
          date BETWEEN '2024-01-01' AND '2024-12-31'
        GROUP BY 
          DATE_FORMAT(date, '%b')
        ORDER BY 
          FIELD(DATE_FORMAT(date, '%b'), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
      `, (err, demandesResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Erreur lors de la récupération des données' });
        }
  
        // Requête pour compter le nombre d'éléments dans la table dossier où le champ ETAT=accepté, par mois
        connection.query(`
          SELECT 
            DATE_FORMAT(d.DATEDEBUTDESEANCE, '%b') AS name,
            COUNT(*) AS stagiaires
          FROM 
            dossier d
          WHERE 
            d.ETAT = 'accepté' 
          GROUP BY 
            DATE_FORMAT(d.DATEDEBUTDESEANCE, '%b')
          ORDER BY 
            FIELD(DATE_FORMAT(d.DATEDEBUTDESEANCE, '%b'), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
        `, (err, stagiairesResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des données' });
          }
  
          // Créer un tableau de données sous la forme souhaitée
          const data = demandesResults.map((demande, index) => ({
            name: demande.name,
            stagiaires: stagiairesResults[index] ? stagiairesResults[index].stagiaires : 0,
            demandes: demande.demandes
          }));
  
          res.json(data);
        });
      });
    };
  
    getDemandesPerMonth(req, res);
  });
  
  module.exports = router;