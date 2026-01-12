// --- 1. RÉCUPÉRER L'HISTORIQUE GLOBAL DES RAPPORTS ---
exports.getHistorique = async (pool, req, res) => {
  const query = `
    SELECT r.IDDOSSIER,
           r.MATRICULE,
           r.COMMENTAIRE,
           r.THEME,
           r.FICHIER,
           DATE_FORMAT(r.DATE, '%d/%m/%Y') AS DATE,
           e.NOMETUDIANT,
           e.PRENOMETUDIANT,
           e.ETABLISSEMENT
    FROM rapport r
    JOIN etudiant e ON e.MATRICULEETUDIANT = r.MATRICULE
  `;

  try {
    const [results] = await pool.query(query);

    if (results.length === 0) {
      // On renvoie un tableau vide plutôt qu'une erreur 404
      // Cela permet au frontend d'afficher "Aucun rapport trouvé" proprement
      return res.json([]);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    const rapports = results.map(rapport => ({
      ...rapport,
      FICHIER: rapport.FICHIER ? `${baseUrl}${rapport.FICHIER}` : null,
    }));

    res.json(rapports);
  } catch (error) {
    console.error('Erreur SQL historique global:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des rapports' });
  }
};

// --- 2. RÉCUPÉRER LA LISTE DES RAPPORTS SPÉCIAUX (UTILES) ---
exports.getHistoriqueSpeciaux = async (pool, req, res) => {
  const query = `
    SELECT r.IDDOSSIER,
           r.MATRICULE,
           r.COMMENTAIRE,
           r.THEME,
           r.FICHIER,
           DATE_FORMAT(r.DATE, '%d/%m/%Y') AS DATE,
           e.NOMETUDIANT,
           e.PRENOMETUDIANT,
           e.ETABLISSEMENT
    FROM rapport r
    JOIN etudiant e ON e.MATRICULEETUDIANT = r.MATRICULE
    WHERE r.COMMENTAIRE = "utile"
  `;

  try {
    const [results] = await pool.query(query);

    if (results.length === 0) {
      return res.json([]);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    const rapportsSpeciaux = results.map(rapport => ({
      ...rapport,
      FICHIER: rapport.FICHIER ? `${baseUrl}${rapport.FICHIER}` : null,
    }));

    res.json(rapportsSpeciaux);
  } catch (error) {
    console.error('Erreur SQL historique spéciaux:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports spéciaux' });
  }
};