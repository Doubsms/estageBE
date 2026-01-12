const express = require('express');
const router = express.Router();

// 1. Endpoint pour récupérer les compteurs (Cards du dashboard)
router.get('/dashboard-data', async (req, res) => {
  const pool = req.app.get('connection');

  try {
    // On lance les 3 requêtes en parallèle pour plus de performance
    const [acceptedRes] = await pool.query("SELECT COUNT(*) AS currentInterns FROM dossier WHERE etat = 'accepté'");
    const [pendingRes] = await pool.query("SELECT COUNT(*) AS pendingRequests FROM dossier WHERE etat = 'non traité'");
    const [totalStaffRes] = await pool.query("SELECT COUNT(*) AS totalStaff FROM etudiant");

    // Construction de l'objet de réponse
    const data = {
      currentInterns: acceptedRes[0].currentInterns,
      pendingRequests: pendingRes[0].pendingRequests,
      totalStaff: totalStaffRes[0].totalStaff
    };

    res.json(data);
  } catch (err) {
    console.error('Erreur dashboard-data:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// 2. Endpoint pour le graphique (Données mensuelles)
router.get('/dashboardgraphic', async (req, res) => {
  const pool = req.app.get('connection');

  try {
    // Requête pour les demandes (table etudiant)
    const [demandesResults] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%b') AS name,
        COUNT(*) AS demandes
      FROM etudiant
      WHERE date BETWEEN '2024-01-01' AND '2024-12-31'
      GROUP BY DATE_FORMAT(date, '%b')
      ORDER BY FIELD(name, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
    `);

    // Requête pour les stagiaires acceptés (table dossier)
    const [stagiairesResults] = await pool.query(`
      SELECT 
        DATE_FORMAT(DATEDEBUTDESEANCE, '%b') AS name,
        COUNT(*) AS stagiaires
      FROM dossier
      WHERE ETAT = 'accepté' 
      GROUP BY DATE_FORMAT(DATEDEBUTDESEANCE, '%b')
      ORDER BY FIELD(name, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
    `);

    // Fusion des résultats pour le format attendu par Recharts (Frontend)
    // On utilise un dictionnaire pour s'assurer que les mois correspondent
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = months.map(month => {
      const d = demandesResults.find(r => r.name === month);
      const s = stagiairesResults.find(r => r.name === month);
      return {
        name: month,
        demandes: d ? d.demandes : 0,
        stagiaires: s ? s.stagiaires : 0
      };
    });

    res.json(data);
  } catch (err) {
    console.error('Erreur dashboardgraphic:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des données graphiques' });
  }
});

module.exports = router;