// Récupérer la liste des demandes non traitées
exports.getDemandesNT = async (pool, req, res) => {
  const query = `
    SELECT e.MATRICULEETUDIANT,
           e.NOMETUDIANT,
           e.PRENOMETUDIANT,
           e.ETABLISSEMENT,
           e.EMAIL,
           DATE_FORMAT(d.DATEDEBUTDESEANCE, '%d/%m/%Y') AS DATEDEBUTDESEANCE,
           d.NUMERODEDOSSIER,
           d.CNI,
           d.CERTIFICAT,
           d.LETTREMOTIVATION,
           d.LETTRERECOMMENDATION
    FROM etudiant e
    JOIN dossier d ON e.MATRICULEETUDIANT = d.MATRICULEETUDIANT
    WHERE d.ETAT = "non traité"
  `;

  try {
    // Exécution de la requête avec await
    const [results] = await pool.query(query);

    // Si aucun résultat, on renvoie un tableau vide (plus propre pour le frontend que de renvoyer une erreur 404)
    if (results.length === 0) {
      return res.json([]);
    }

    // Ajouter le chemin complet pour les fichiers
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    const demandes = results.map(demande => ({
      ...demande,
      CNI: demande.CNI ? `${baseUrl}${demande.CNI}` : null,
      CERTIFICAT: demande.CERTIFICAT ? `${baseUrl}${demande.CERTIFICAT}` : null,
      LETTREMOTIVATION: demande.LETTREMOTIVATION ? `${baseUrl}${demande.LETTREMOTIVATION}` : null,
      LETTRERECOMMENDATION: demande.LETTRERECOMMENDATION ? `${baseUrl}${demande.LETTRERECOMMENDATION}` : null
    }));

    res.json(demandes);

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes non traitées :', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des demandes non traitées' 
    });
  }
};