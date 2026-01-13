const express = require('express');
const router = express.Router();

// 1. Endpoint pour récupérer les compteurs (Cards du dashboard)
router.get('/dashboard-data', async (req, res) => {
  const pool = req.app.get('connection');

  try {
    // On lance les 3 requêtes en parallèle pour plus de performance
    const [acceptedRes] = await pool.query("SELECT COUNT(*) AS currentInterns FROM dossier WHERE etat = 'accepté' AND DATEDEBUTDESEANCE <= CURDATE() AND DATEFINDESEANCE >= CURDATE()");
    const [pendingRes] = await pool.query("SELECT COUNT(*) AS pendingRequests FROM dossier WHERE etat = 'non traité'");
    const [totalStaffRes] = await pool.query("SELECT COUNT(*) AS totalStaff FROM etudiant");
    const [totalReport] = await pool.query("SELECT COUNT(*) AS totalReport FROM rapport");
    const [totalEncadreur] = await pool.query("SELECT COUNT(*) AS totalEncadreur FROM encadreur");
    const [anneePlusActif] = await pool.query("SELECT YEAR(DATEDEBUTDESEANCE) AS annee, COUNT(*) AS total_stagiaires FROM dossier WHERE ETAT = 'accepté' GROUP BY annee ORDER BY total_stagiaires DESC LIMIT 1");
    const [totalAdminis] = await pool.query("SELECT COUNT(*) AS totalAdminis FROM administrateur");

    const data = {
      currentInterns: acceptedRes[0].currentInterns,
      pendingRequests: pendingRes[0].pendingRequests,
      totalStaff: totalStaffRes[0].totalStaff,
      totalReport: totalReport[0].totalReport,
      totalEncadreur: totalEncadreur[0].totalEncadreur,
      anneePlusActif: anneePlusActif[0].annee,
      totalAdminis: totalAdminis[0].totalAdminis,
    };

    res.json(data);
  } catch (err) {
    console.error('Erreur dashboard-data:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// 2. Endpoint pour récupérer les années disponibles
router.get('/available-years', async (req, res) => {
  const pool = req.app.get('connection');

  try {
    // Récupérer les années distinctes depuis la table etudiant (date d'inscription)
    const [yearsFromEtudiant] = await pool.query(`
      SELECT DISTINCT YEAR(date) as year 
      FROM etudiant 
      WHERE date IS NOT NULL 
      ORDER BY year DESC
    `);

    // Récupérer les années distinctes depuis la table dossier (date de début de séance)
    const [yearsFromDossier] = await pool.query(`
      SELECT DISTINCT YEAR(DATEDEBUTDESEANCE) as year 
      FROM dossier 
      WHERE DATEDEBUTDESEANCE IS NOT NULL 
      ORDER BY year DESC
    `);

    // Fusionner et dédoublonner les années
    const allYears = [
      ...yearsFromEtudiant.map(row => row.year),
      ...yearsFromDossier.map(row => row.year)
    ].filter(year => year !== null);

    const uniqueYears = [...new Set(allYears)].sort((a, b) => b - a);

    // Toujours inclure l'année courante
    const currentYear = new Date().getFullYear();
    if (!uniqueYears.includes(currentYear)) {
      uniqueYears.unshift(currentYear);
    }

    res.json({
      years: uniqueYears,
      message: 'Années disponibles récupérées avec succès'
    });
  } catch (err) {
    console.error('Erreur available-years:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des années disponibles',
      years: [new Date().getFullYear()] // Retourner au moins l'année courante en cas d'erreur
    });
  }
});

// 3. Endpoint pour le graphique avec filtre d'année
router.get('/dashboardgraphic', async (req, res) => {
  const pool = req.app.get('connection');
  const { year } = req.query;
  
  // Utiliser l'année courante par défaut si non spécifiée
  const targetYear = year || new Date().getFullYear();

  try {
    // Requête pour les demandes (table etudiant) avec filtre d'année
    const [demandesResults] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%b') AS name,
        DATE_FORMAT(date, '%m') AS month_num,
        COUNT(*) AS demandes
      FROM etudiant
      WHERE YEAR(date) = ?
      GROUP BY DATE_FORMAT(date, '%b'), DATE_FORMAT(date, '%m')
      ORDER BY month_num
    `, [targetYear]);

    // Requête pour les stagiaires acceptés (table dossier) avec filtre d'année
    const [stagiairesResults] = await pool.query(`
      SELECT 
        DATE_FORMAT(DATEDEBUTDESEANCE, '%b') AS name,
        DATE_FORMAT(DATEDEBUTDESEANCE, '%m') AS month_num,
        COUNT(*) AS stagiaires
      FROM dossier
      WHERE ETAT = 'accepté' 
        AND YEAR(DATEDEBUTDESEANCE) = ?
      GROUP BY DATE_FORMAT(DATEDEBUTDESEANCE, '%b'), DATE_FORMAT(DATEDEBUTDESEANCE, '%m')
      ORDER BY month_num
    `, [targetYear]);

    // Créer un objet map pour fusionner facilement
    const monthData = {};
    
    // Initialiser tous les mois avec zéro
    const months = [
      { name: 'Jan', num: '01' },
      { name: 'Feb', num: '02' },
      { name: 'Mar', num: '03' },
      { name: 'Apr', num: '04' },
      { name: 'May', num: '05' },
      { name: 'Jun', num: '06' },
      { name: 'Jul', num: '07' },
      { name: 'Aug', num: '08' },
      { name: 'Sep', num: '09' },
      { name: 'Oct', num: '10' },
      { name: 'Nov', num: '11' },
      { name: 'Dec', num: '12' }
    ];

    // Initialiser la structure
    months.forEach(month => {
      monthData[month.num] = {
        name: month.name,
        demandes: 0,
        stagiaires: 0
      };
    });

    // Remplir avec les données des demandes
    demandesResults.forEach(row => {
      if (monthData[row.month_num]) {
        monthData[row.month_num].demandes = row.demandes;
      }
    });

    // Remplir avec les données des stagiaires
    stagiairesResults.forEach(row => {
      if (monthData[row.month_num]) {
        monthData[row.month_num].stagiaires = row.stagiaires;
      }
    });

    // Convertir en tableau pour le frontend
    const data = months.map(month => monthData[month.num]);

    // Ajouter des métadonnées
    const response = {
      year: targetYear,
      data: data,
      summary: {
        totalDemandes: data.reduce((sum, item) => sum + item.demandes, 0),
        totalStagiaires: data.reduce((sum, item) => sum + item.stagiaires, 0),
        peakMonth: data.reduce((max, item) => 
          (item.demandes + item.stagiaires) > (max.demandes + max.stagiaires) ? item : data[0]
        ).name
      }
    };

    res.json(response.data); // Retourner seulement les données pour compatibilité
  } catch (err) {
    console.error('Erreur dashboardgraphic:', err);
    
    // En cas d'erreur, retourner des données par défaut pour l'année demandée
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const defaultData = months.map(month => ({
      name: month,
      demandes: 0,
      stagiaires: 0
    }));
    
    res.json(defaultData);
  }
});

// 4. Endpoint pour les statistiques annuelles comparatives
router.get('/yearly-comparison', async (req, res) => {
  const pool = req.app.get('connection');
  const { years } = req.query; // Format: ?years=2023,2024,2025

  try {
    let yearList = [];
    if (years) {
      yearList = years.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
    } else {
      // Par défaut, 3 dernières années
      const currentYear = new Date().getFullYear();
      yearList = [currentYear - 2, currentYear - 1, currentYear];
    }

    const comparisonData = [];

    for (const year of yearList) {
      // Demandes pour l'année
      const [demandesRes] = await pool.query(
        'SELECT COUNT(*) as count FROM etudiant WHERE YEAR(date) = ?',
        [year]
      );

      // Stagiaires acceptés pour l'année
      const [stagiairesRes] = await pool.query(
        `SELECT COUNT(*) as count FROM dossier 
         WHERE ETAT = 'accepté' AND YEAR(DATEDEBUTDESEANCE) = ?`,
        [year]
      );

      comparisonData.push({
        year: year,
        demandes: demandesRes[0].count || 0,
        stagiaires: stagiairesRes[0].count || 0,
        conversionRate: demandesRes[0].count > 0 
          ? ((stagiairesRes[0].count / demandesRes[0].count) * 100).toFixed(1)
          : 0
      });
    }

    res.json({
      comparison: comparisonData,
      message: 'Comparaison annuelle récupérée avec succès'
    });
  } catch (err) {
    console.error('Erreur yearly-comparison:', err);
    res.status(500).json({ error: 'Erreur lors de la comparaison annuelle' });
  }
});

module.exports = router;