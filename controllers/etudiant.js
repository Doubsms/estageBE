// controllers/etudiant.js

// 1. Récupérer tous les étudiants
exports.getAll = async (pool, req, res) => {
  const query = 'SELECT * FROM etudiant';
  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erreur SQL getAll étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des étudiants' });
  }
};

// 2. Récupérer un étudiant par son matricule
exports.getByMatricule = async (pool, req, res) => {
  const matriculeEtudiant = req.params.matricule;
  const query = 'SELECT * FROM etudiant WHERE MATRICULEETUDIANT = ?';
  try {
    const [results] = await pool.query(query, [matriculeEtudiant]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Erreur SQL getByMatricule:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'étudiant' });
  }
};

// 3. Créer un nouvel étudiant
exports.create = async (pool, req, res) => {
  const { 
    MATRICULEETUDIANT, NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, 
    VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, TEL, FILIERE, SEXE 
  } = req.body;

  const query = `
    INSERT INTO etudiant 
    (MATRICULEETUDIANT, NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, TEL, FILIERE, SEXE) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await pool.query(query, [
      MATRICULEETUDIANT, NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, 
      VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL, TEL, FILIERE, SEXE
    ]);
    res.json({ message: 'Étudiant créé avec succès' });
  } catch (error) {
    console.error('Erreur SQL create étudiant:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce matricule étudiant existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'étudiant' });
  }
};

// 4. Mettre à jour un étudiant
exports.update = async (pool, req, res) => {
  const matriculeEtudiant = req.params.matricule;
  const { NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, PARCOURS, NIVEAU, EMAIL } = req.body;

  const query = `
    UPDATE etudiant 
    SET NOMETUDIANT = ?, PRENOMETUDIANT = ?, ETABLISSEMENT = ?, VILLERESIDENCE = ?, PARCOURS = ?, NIVEAU = ?, EMAIL = ? 
    WHERE MATRICULEETUDIANT = ?
  `;

  try {
    const [results] = await pool.query(query, [
      NOMETUDIANT, PRENOMETUDIANT, ETABLISSEMENT, VILLERESIDENCE, 
      PARCOURS, NIVEAU, EMAIL, matriculeEtudiant
    ]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    res.json({ message: 'Étudiant mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur SQL update étudiant:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'étudiant' });
  }
};

// 5. Supprimer un étudiant
exports.delete = async (pool, req, res) => {
  const matriculeEtudiant = req.params.matricule;
  const query = 'DELETE FROM etudiant WHERE MATRICULEETUDIANT = ?';

  try {
    const [results] = await pool.query(query, [matriculeEtudiant]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    res.json({ message: 'Étudiant supprimé avec succès' });
  } catch (error) {
    console.error('Erreur SQL delete étudiant:', error);
    // Gestion d'erreur si l'étudiant a déjà un dossier (contrainte d'intégrité)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Impossible de supprimer cet étudiant car il possède des dossiers liés.' });
    }
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'étudiant' });
  }
};