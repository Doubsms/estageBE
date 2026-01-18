const express = require('express');
const router = express.Router();

// 1. Endpoint pour récupérer les compteurs (Cards du dashboard)
router.get('/dashboard-data', async (req, res) => {
  try {
    // On lance les requêtes en parallèle pour plus de performance
    const [
      currentInterns,
      pendingRequests,
      totalStaff,
      totalReport,
      totalEncadreur,
      anneePlusActif,
      totalAdminis,
      totalRequests,  // CORRECTION: 'totalrequests' → 'totalRequests' (camelCase)
    ] = await Promise.all([
      // 1. Stagiaires actuellement en stage
      req.prisma.dossier.count({
        where: {
          ETAT: 'accepté',
          DATEDEBUTDESEANCE: { 
            lte: new Date() 
          },
          DATEFINDESEANCE: { 
            gte: new Date() 
          }
        }
      }),

      // 2. Demandes en attente
      req.prisma.dossier.count({
        where: { 
          ETAT: 'non traité'
        }
      }),
      
      // 3. Total des étudiants
      req.prisma.etudiant.count(),
      
      // 4. Total des rapports
      req.prisma.rapport.count(),
      
      // 5. Total des encadreurs
      req.prisma.encadreur.count(),
      
      // 6. Année la plus active
      (async () => {
        try {
          // Utilisation de $queryRaw pour la requête GROUP BY
          // CORRECTION: vérifier si vous utilisez MySQL ou PostgreSQL
          const result = await req.prisma.$queryRaw`
            SELECT 
              YEAR(	DATEDEPOT) AS annee, 
              COUNT(*) AS total_stagiaires 
            FROM Dossier  -- CORRECTION: nom de la table avec majuscule si nécessaire
            WHERE DATEDEBUTDESEANCE IS NOT NULL
            GROUP BY YEAR(DATEDEPOT) 
            ORDER BY total_stagiaires DESC 
            LIMIT 1
          `;
          
          // Vérification et conversion
          if (result && Array.isArray(result) && result.length > 0) {
            const annee = result[0].annee;
            return annee ? Number(annee) : null;
          }
          return null;
        } catch (error) {
          console.error('Erreur dans la requête anneePlusActif:', error);
          return null;
        }
      })(),
      
      // 7. Total des administrateurs
      req.prisma.administrateur.count(),

      // 8. Total Demandes reçues à l'INS
      // CORRECTION: 'dossiers' → 'dossier' (singulier selon votre modèle)
      req.prisma.dossier.count()  // CORRECTION: retirer le 's'

    ]);

    const data = {
      currentInterns: Number(currentInterns),
      pendingRequests: Number(pendingRequests),
      totalStaff: Number(totalStaff),
      totalReport: Number(totalReport),
      totalEncadreur: Number(totalEncadreur),
      anneePlusActif,
      totalAdminis: Number(totalAdminis),
      totalrequests: Number(totalRequests),  // CORRECTION: variable nommée totalRequests
    };

    console.log('📊 Dashboard data récupérée:', data);
    res.json(data);
  } catch (err) {
    console.error('Erreur dashboard-data:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 2. Endpoint pour récupérer les années disponibles (version optimisée)
router.get('/available-years', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    let uniqueYears = [currentYear]; // Commencer avec l'année courante

    try {
      // Tentative avec raw SQL (plus efficace)
      const yearsQuery = await req.prisma.$queryRaw`
        SELECT DISTINCT year_value FROM (
          SELECT YEAR(date) as year_value FROM etudiant WHERE date IS NOT NULL
          UNION
          SELECT YEAR(DATEDEBUTDESEANCE) as year_value FROM dossier WHERE DATEDEBUTDESEANCE IS NOT NULL
        ) AS years
        WHERE year_value IS NOT NULL
        ORDER BY year_value DESC
      `;

      if (yearsQuery && yearsQuery.length > 0) {
        const sqlYears = yearsQuery.map(row => Number(row.year_value)).filter(y => !isNaN(y));
        
        // Fusionner avec l'année courante
        uniqueYears = [...new Set([currentYear, ...sqlYears])].sort((a, b) => b - a);
      }
    } catch (sqlError) {
      console.log('⚠️ Raw SQL non disponible, utilisation de l\'alternative...');
      
      // Alternative sans raw SQL
      const [etudiants, dossiers] = await Promise.all([
        req.prisma.etudiant.findMany({
          select: { DATE: true },
          where: { DATE: { not: null } }
        }),
        req.prisma.dossier.findMany({
          select: { DATEDEBUTDESEANCE: true },
          where: { DATEDEBUTDESEANCE: { not: null } }
        })
      ]);

      const yearsSet = new Set([currentYear]);
      
      etudiants.forEach(e => {
        if (e.DATE) yearsSet.add(new Date(e.DATE).getFullYear());
      });
      
      dossiers.forEach(d => {
        if (d.DATEDEBUTDESEANCE) yearsSet.add(new Date(d.DATEDEBUTDESEANCE).getFullYear());
      });

      uniqueYears = Array.from(yearsSet).sort((a, b) => b - a);
    }

    res.json({
      success: true,
      years: uniqueYears,
      message: 'Années disponibles récupérées avec succès',
      count: uniqueYears.length
    });
  } catch (err) {
    console.error('Erreur available-years:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des années disponibles',
      years: [new Date().getFullYear()]
    });
  }
});

// 3. Endpoint pour le graphique avec filtre d'année (abréviations 3 lettres)
router.get('/dashboardgraphic', async (req, res) => {
  const { year } = req.query;
  const targetYear = parseInt(year) || new Date().getFullYear();

  try {
    // Abréviations des mois (3 premières lettres)
    const moisAbrev = [
      { name: 'Jan', num: 1 },
      { name: 'Fév', num: 2 },
      { name: 'Mar', num: 3 },
      { name: 'Avr', num: 4 },
      { name: 'Mai', num: 5 },
      { name: 'Jui', num: 6 },
      { name: 'Jui', num: 7 }, // Juillet aussi "Jui" (3 lettres)
      { name: 'Aoû', num: 8 },
      { name: 'Sep', num: 9 },
      { name: 'Oct', num: 10 },
      { name: 'Nov', num: 11 },
      { name: 'Déc', num: 12 }
    ];

    const dataPromises = moisAbrev.map(async (mois) => {
      // Dates de début et fin du mois
      const startDate = new Date(targetYear, mois.num - 1, 1);
      const endDate = new Date(targetYear, mois.num, 0); // Dernier jour du mois

      // Compter les demandes pour ce mois
      const demandes = await req.prisma.etudiant.count({
        where: {
          DATE: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Compter les stagiaires acceptés pour ce mois
      const stagiaires = await req.prisma.dossier.count({
        where: {
          ETAT: 'accepté',
          DATEDEBUTDESEANCE: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      return {
        name: mois.name,
        demandes,
        stagiaires,
        monthNumber: mois.num
      };
    });

    // Exécuter toutes les promesses en parallèle
    const data = await Promise.all(dataPromises);

    // Calculer les statistiques
    const totalDemandes = data.reduce((sum, item) => sum + item.demandes, 0);
    const totalStagiaires = data.reduce((sum, item) => sum + item.stagiaires, 0);
    
    let peakMonth = data[0];
    let maxActivity = 0;
    
    data.forEach(item => {
      const activity = item.demandes + item.stagiaires;
      if (activity > maxActivity) {
        maxActivity = activity;
        peakMonth = item;
      }
    });

    // Enrichir la réponse (optionnel)
    const response = {
      year: targetYear,
      data: data,
      summary: {
        totalDemandes,
        totalStagiaires,
        peakMonth: peakMonth.name,
        moisActifNumero: peakMonth.monthNumber,
        conversionRate: totalDemandes > 0 ? 
          ((totalStagiaires / totalDemandes) * 100).toFixed(1) + '%' : '0%'
      }
    };

    // Retourner seulement les données pour compatibilité
    res.json(response.data);
  } catch (err) {
    console.error('Erreur dashboardgraphic:', err);
    
    // Fallback avec abréviations (3 lettres)
    const moisAbrev = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 
                       'Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    const defaultData = moisAbrev.map((nomMois, index) => ({
      name: nomMois,
      demandes: 0,
      stagiaires: 0,
      monthNumber: index + 1
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