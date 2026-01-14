// controllers/attribution.js

// 1. Récupérer toutes les attributions
exports.getAll = async (pool, req, res) => {
  const query = 'SELECT * FROM attribuer';
  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des attributions :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des attributions' });
  }
};

// 2. Récupérer une attribution par ses clés composites
exports.getByMatriculesAndDossier = async (pool, req, res) => {
  const { matriculeCharge, matriculeEncadreur, idDossier } = req.params;
  const query = 'SELECT * FROM attribuer WHERE MATRICULECHARGEDESTAGE = ? AND MATRICULEENCADREUR = ? AND IDDOSSIER = ?';
  
  try {
    const [results] = await pool.query(query, [matriculeCharge, matriculeEncadreur, idDossier]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Attribution non trouvée' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'attribution :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'attribution' });
  }
};

// 3. Créer une attribution (Recherche Admin + Insertion)
exports.create = async (pool, req, res) => {
  const { adminemail, selectedSupervisor, dossier } = req.body;

  console.log('Données reçues pour la création de l\'attribution :', { adminemail, selectedSupervisor, dossier });

  try {
    // Étape 1 : Récupérer le matricule de l'administrateur
    const getAdminQuery = 'SELECT MATRICULEADMIN FROM administrateur WHERE EMAILADMIN = ?';
    const [adminResults] = await pool.query(getAdminQuery, [adminemail]);

    if (adminResults.length === 0) {
      return res.status(404).json({ error: 'Administrateur non trouvé avec cet email' });
    }

    const matriculeAdmin = adminResults[0].MATRICULEADMIN;

    // Étape 2 : Insertion dans la table attribuer
    const insertQuery = 'INSERT INTO attribuer (MATRICULECHARGEDESTAGE, MATRICULEENCADREUR, IDDOSSIER) VALUES (?, ?, ?)';
    await pool.query(insertQuery, [matriculeAdmin, selectedSupervisor, dossier]);

    res.status(201).json({ message: 'Attribution insérée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la création de l\'attribution :', error);
    // Gestion des erreurs de doublons (si l'attribution existe déjà)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cette attribution existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'insertion de l\'attribution' });
  }
};

// 4. Supprimer une attribution
exports.delete = async (pool, req, res) => {
  const { matriculeCharge, matriculeEncadreur, idDossier } = req.params;
  const query = 'DELETE FROM attribuer WHERE MATRICULECHARGEDESTAGE = ? AND MATRICULEENCADREUR = ? AND IDDOSSIER = ?';

  try {
    const [result] = await pool.query(query, [matriculeCharge, matriculeEncadreur, idDossier]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attribution non trouvée' });
    }
    
    res.json({ message: 'Attribution supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'attribution :', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'attribution' });
  }
};