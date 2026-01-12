// controllers/charge_de_stage.js

// 1. Récupérer tous les chargés de stage
exports.getAll = async (pool, req, res) => {
  const query = 'SELECT * FROM charge_de_stage';
  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des charges de stage :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des charges de stage' });
  }
};

// 2. Récupérer un chargé de stage par son matricule
exports.getById = async (pool, req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM charge_de_stage WHERE MATRICULECHARGEDESTAGE = ?';
  try {
    const [results] = await pool.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Charge de stage non trouvé' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du charge de stage :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du charge de stage' });
  }
};

// 3. Créer un nouveau chargé de stage
exports.create = async (pool, req, res) => {
  const { MATRICULECHARGEDESTAGE, NOMCS, PRENOMCS } = req.body;
  const query = 'INSERT INTO charge_de_stage (MATRICULECHARGEDESTAGE, NOMCS, PRENOMCS) VALUES (?, ?, ?)';
  try {
    await pool.query(query, [MATRICULECHARGEDESTAGE, NOMCS, PRENOMCS]);
    res.json({ message: 'Charge de stage créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création du charge de stage :', error);
    // Gestion spécifique si le matricule existe déjà
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce matricule existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création du charge de stage' });
  }
};

// 4. Mettre à jour un chargé de stage
exports.update = async (pool, req, res) => {
  const id = req.params.id;
  const { NOMCS, PRENOMCS } = req.body;
  const query = 'UPDATE charge_de_stage SET NOMCS = ?, PRENOMCS = ? WHERE MATRICULECHARGEDESTAGE = ?';
  try {
    const [result] = await pool.query(query, [NOMCS, PRENOMCS, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Charge de stage non trouvé' });
    }
    res.json({ message: 'Charge de stage mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du charge de stage :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du charge de stage' });
  }
};

// 5. Supprimer un chargé de stage
exports.delete = async (pool, req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM charge_de_stage WHERE MATRICULECHARGEDESTAGE = ?';
  try {
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Charge de stage non trouvé' });
    }
    res.json({ message: 'Charge de stage supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du charge de stage :', error);
    // Erreur si le chargé de stage est lié à des attributions existantes
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Impossible de supprimer ce chargé car il a des attributions en cours' });
    }
    res.status(500).json({ error: 'Erreur lors de la suppression du charge de stage' });
  }
};