// Récupérer la liste des demandes non traitées
exports.getDemandesNT = (connection, req, res) => {
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

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des demandes non traitées :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des demandes non traitées' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Aucune demande non traitée trouvée' });
      return;
    }

    // Ajouter le chemin complet pour les fichiers
    const demandes = results.map(demande => ({
      ...demande,
      CNI: `${req.protocol}://${req.get('host')}/uploads/${demande.CNI}`,
      CERTIFICAT: `${req.protocol}://${req.get('host')}/uploads/${demande.CERTIFICAT}`,
      LETTREMOTIVATION: `${req.protocol}://${req.get('host')}/uploads/${demande.LETTREMOTIVATION}`,
      LETTRERECOMMENDATION: `${req.protocol}://${req.get('host')}/uploads/${demande.LETTRERECOMMENDATION}`
    }));

    res.json(demandes);
  });
};
