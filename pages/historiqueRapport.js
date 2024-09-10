// Récupérer l'historique des depots de rapport
exports.getHistorique = (connection, req, res) => {
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
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération de l\'historique des rapports :', error);
        res.status(500).json({ error: 'Erreur lors de l\'historique des rapports' });
        return;
      }
  
      if (results.length === 0) {
        res.status(404).json({ error: 'Aucun historique trouvé' });
        return;
      }
  
      // Ajouter le chemin complet pour les fichiers
      const demandes = results.map(demande => ({
        ...demande,
        FICHIER: `${req.protocol}://${req.get('host')}/uploads/${demande.FICHIER}`,
      }));
  
      res.json(demandes);
    });
  };
  
  // Récupérer la liste des rapporst spéciaux
exports.getHistoriqueSpeciaux = (connection, req, res) => {
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

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de l\'historique des rapports :', error);
      res.status(500).json({ error: 'Erreur lors de l\'historique des rapports' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Aucun historique trouvé' });
      return;
    }

    // Ajouter le chemin complet pour les fichiers
    const demandes = results.map(demande => ({
      ...demande,
      FICHIER: `${req.protocol}://${req.get('host')}/uploads/${demande.FICHIER}`,
    }));

    res.json(demandes);
  });
};
