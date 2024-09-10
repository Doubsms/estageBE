// Récupérer tous les attributions
exports.getAll = (connection, req, res) => {
  const query = 'SELECT * FROM attribuer';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des attributions :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des attributions' });
      return;
    }
    res.json(results);
  });
};

// Récupérer une attribution par son matricule de charge de stage, encadreur et IDDossier
exports.getByMatriculesAndDossier = (connection, req, res) => {
  const { matriculeCharge, matriculeEncadreur, idDossier } = req.params;
  const query = 'SELECT * FROM attribuer WHERE MATRICULECHARGEDESTAGE = ? AND MATRICULEENCADREUR = ? AND IDDOSSIER = ?';
  connection.query(query, [matriculeCharge, matriculeEncadreur, idDossier], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de l\'attribution :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'attribution' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Attribution non trouvée' });
      return;
    }
    res.json(results[0]);
  });
};

// Méthode pour créer une attribution basée sur l'email de l'administrateur, le matricule de l'encadreur et IDDossier
exports.create = (connection, req, res) => {
  const { adminemail, selectedSupervisor, dossier } = req.body; // Utiliser req.body pour recevoir les données
  const getAdminQuery = 'SELECT MATRICULEADMIN FROM administrateur WHERE EMAILADMIN = ?';

  // Récupérer le matricule de l'administrateur à partir de son email
  connection.query(getAdminQuery, [adminemail], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération du matricule de l\'administrateur :', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération du matricule de l\'administrateur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Administrateur non trouvé avec cet email' });
    }

    const matriculeAdmin = results[0].MATRICULEADMIN;

    // Insertion dans la table attribuer
    const insertQuery = 'INSERT INTO attribuer (MATRICULECHARGEDESTAGE, MATRICULEENCADREUR, IDDOSSIER) VALUES (?, ?, ?)';
    connection.query(insertQuery, [matriculeAdmin,selectedSupervisor, dossier], (insertError) => {
      if (insertError) {
        console.error('Erreur lors de l\'insertion de l\'attribution :', insertError);
        return res.status(500).json({ error: 'Erreur lors de l\'insertion de l\'attribution' });
      }
      res.status(201).json({ message: 'Attribution insérée avec succès' });
    });
  });
};

// Supprimer une attribution
exports.delete = (connection, req, res) => {
  const { matriculeCharge, matriculeEncadreur, idDossier } = req.params;
  const query = 'DELETE FROM attribuer WHERE MATRICULECHARGEDESTAGE = ? AND MATRICULEENCADREUR = ? AND IDDOSSIER = ?';
  connection.query(query, [matriculeCharge, matriculeEncadreur, idDossier], (error, results) => {
    if (error) {
      console.error('Erreur lors de la suppression de l\'attribution :', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'attribution' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Attribution non trouvée' });
      return;
    }
    res.json({ message: 'Attribution supprimée avec succès' });
  });
};