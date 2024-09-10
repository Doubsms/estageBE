// controllers/encadreur.js

// Récupérer tous les encadreurs
exports.getAll = (connection, req, res) => {
  const query = 'SELECT * FROM encadreur';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des encadreurs :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des encadreurs' });
      return;
    }
    res.json(results);
  });
};

// Récupérer un encadreur par son ID
exports.getById = (connection, req, res) => {
  const encadreurId = req.params.id;
  const query = 'SELECT * FROM encadreur WHERE MATRICULEENCADREUR = ?';
  connection.query(query, [encadreurId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de l\'encadreur :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'encadreur' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Encadreur non trouvé' });
      return;
    }
    res.json(results[0]);
  });
};

// Créer un nouvel encadreur
exports.create = (connection, req, res) => {
  const { MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, DIVISION, POSTE } = req.body;
  const query = 'INSERT INTO encadreur (MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT,DIVISION, POSTE) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(query, [MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, DIVISION, POSTE], (error, results) => {
    if (error) {
      console.error('Erreur lors de la création de l\'encadreur :', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'encadreur' });
      return;
    }
    res.json({ message: 'Encadreur créé avec succès' });
  });
};

// Mettre à jour un encadreur
exports.update = (connection, req, res) => {
  const encadreurId = req.params.id;
  const { NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, POSTE } = req.body;
  const query = 'UPDATE encadreur SET NOMENCADREUR = ?, PRENOMENCADREUR = ?, DEPARTEMENT = ?, POSTE = ? WHERE MATRICULEENCADREUR = ?';
  connection.query(query, [NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, POSTE, encadreurId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la mise à jour de l\'encadreur :', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'encadreur' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Encadreur non trouvé' });
      return;
    }
    res.json({ message: 'Encadreur mis à jour avec succès' });
  });
};

// Supprimer un encadreur
exports.delete = (connection, req, res) => {
  const encadreurId = req.params.id;
  const query = 'DELETE FROM encadreur WHERE MATRICULEENCADREUR = ?';
  connection.query(query, [encadreurId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la suppression de l\'encadreur :', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'encadreur' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Encadreur non trouvé' });
      return;
    }
    res.json({ message: 'Encadreur supprimé avec succès' });
  });
};
