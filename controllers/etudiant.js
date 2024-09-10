// Récupérer tous les étudiants
exports.getAll = (connection, req, res) => {
    const query = 'SELECT * FROM etudiant';
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des étudiants' });
        return;
      }
      res.json(results);
    });
  };
  
  // Récupérer un étudiant par son matricule
  exports.getByMatricule = (connection, req, res) => {
    const matriculeEtudiant = req.params.matricule;
    const query = 'SELECT * FROM etudiant WHERE MATRICULEETUDIANT = ?';
    connection.query(query, [matriculeEtudiant], (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération de l\'étudiant :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'étudiant' });
        return;
      }
      if (results.length === 0) {
        res.status(404).json({ error: 'Étudiant non trouvé' });
        return;
      }
      res.json(results[0]);
    });
  };
  
  // Créer un nouvel étudiant
  exports.create = (connection, req, res) => {
    const { MATRICULEETUDIANT, NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, TEL, FILIERE, SEXE } = req.body;
    const query = 'INSERT INTO etudiant (MATRICULEETUDIANT, NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, TEL, FILIERE, SEXE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(query, [MATRICULEETUDIANT, NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, TEL, FILIERE, SEXE], (error, results) => {
      if (error) {
        console.error('Erreur lors de la création de l\'étudiant :', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'étudiant' });
        return;
      }
      res.json({ message: 'Étudiant créé avec succès' });
    });
  };
  
  // Mettre à jour un étudiant
  exports.update = (connection, req, res) => {
    const matriculeEtudiant = req.params.matricule;
    const { NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL } = req.body;
    const query = 'UPDATE etudiant SET NOMETUDIANT = ?, PRENOMETUDIANT = ?, ETABLISSEMENT = ?, VILLERESIDENCE = ?, PARCOURS = ?, NIVEAU = ?, EMAIL = ? WHERE MATRICULEETUDIANT = ?';
    connection.query(query, [NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, matriculeEtudiant], (error, results) => {
      if (error) {
        console.error('Erreur lors de la mise à jour de l\'étudiant :', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'étudiant' });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Étudiant non trouvé' });
        return;
      }
      res.json({ message: 'Étudiant mis à jour avec succès' });
    });
  };
  
  // Supprimer un étudiant
  exports.delete = (connection, req, res) => {
    const matriculeEtudiant = req.params.matricule;
    const query = 'DELETE FROM etudiant WHERE MATRICULEETUDIANT = ?';
    connection.query(query, [matriculeEtudiant], (error, results) => {
      if (error) {
        console.error('Erreur lors de la suppression de l\'étudiant :', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'étudiant' });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Étudiant non trouvé' });
        return;
      }
      res.json({ message: 'Étudiant supprimé avec succès' });
    });
  };
  