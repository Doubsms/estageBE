// Récupérer tous les charges de stage
exports.getAll = (connection, req, res) => {
  const query = 'SELECT * FROM charge_de_stage';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des charges de stage :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des charges de stage' });
      return;
    }
    res.json(results);
  });
};

// Récupérer un charge de stage par son ID
exports.getById = (connection, req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM charge_de_stage WHERE MATRICULECHARGEDESTAGE = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération du charge de stage :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du charge de stage' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Charge de stage non trouvé' });
      return;
    }
    res.json(results[0]);
  });
};

// Créer un nouveau charge de stage
exports.create = (connection, req, res) => {
  const { MATRICULECHARGEDESTAGE, NOMCS, PRENOMCS } = req.body;
  const query = 'INSERT INTO charge_de_stage (MATRICULECHARGEDESTAGE, NOMCS, PRENOMCS) VALUES (?, ?, ?)';
  connection.query(query, [MATRICULECHARGEDESTAGE, NOMCS, PRENOMCS], (error, results) => {
    if (error) {
      console.error('Erreur lors de la création du charge de stage :', error);
      res.status(500).json({ error: 'Erreur lors de la création du charge de stage' });
      return;
    }
    res.json({ message: 'Charge de stage créé avec succès' });
  });
};

// Mettre à jour un charge de stage
exports.update = (connection, req, res) => {
  const id = req.params.id;
  const { NOMCS, PRENOMCS } = req.body;
  const query = 'UPDATE charge_de_stage SET NOMCS = ?, PRENOMCS = ? WHERE MATRICULECHARGEDESTAGE = ?';
  connection.query(query, [NOMCS, PRENOMCS, id], (error, results) => {
    if (error) {
      console.error('Erreur lors de la mise à jour du charge de stage :', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du charge de stage' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Charge de stage non trouvé' });
      return;
    }
    res.json({ message: 'Charge de stage mis à jour avec succès' });
  });
};

// Supprimer un charge de stage
exports.delete = (connection, req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM charge_de_stage WHERE MATRICULECHARGEDESTAGE = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Erreur lors de la suppression du charge de stage :', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du charge de stage' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Charge de stage non trouvé' });
      return;
    }
    res.json({ message: 'Charge de stage supprimé avec succès' });
  });
};
