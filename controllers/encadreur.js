// controllers/encadreur.js

// 1. Récupérer tous les encadreurs
exports.getAll = async (pool, req, res) => {
    const query = 'SELECT * FROM encadreur';
    try {
        const [results] = await pool.query(query);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des encadreurs :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des encadreurs' });
    }
};

// 2. Récupérer un encadreur par son ID (Matricule)
exports.getById = async (pool, req, res) => {
    const encadreurId = req.params.id;
    const query = 'SELECT * FROM encadreur WHERE MATRICULEENCADREUR = ?';
    try {
        const [results] = await pool.query(query, [encadreurId]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Encadreur non trouvé' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'encadreur :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'encadreur' });
    }
};

// 3. Créer un nouvel encadreur
exports.create = async (pool, req, res) => {
    const { MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, DIVISION, POSTE } = req.body;
    const query = `
        INSERT INTO encadreur 
        (MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, DIVISION, POSTE) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    try {
        await pool.query(query, [MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, DIVISION, POSTE]);
        res.json({ message: 'Encadreur créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création de l\'encadreur :', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'encadreur' });
    }
};

// 4. Mettre à jour un encadreur
exports.update = async (pool, req, res) => {
    const encadreurId = req.params.id;
    const { NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, POSTE } = req.body;
    const query = `
        UPDATE encadreur 
        SET NOMENCADREUR = ?, PRENOMENCADREUR = ?, DEPARTEMENT = ?, POSTE = ? 
        WHERE MATRICULEENCADREUR = ?
    `;
    try {
        const [result] = await pool.query(query, [NOMENCADREUR, PRENOMENCADREUR, DEPARTEMENT, POSTE, encadreurId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Encadreur non trouvé' });
        }
        res.json({ message: 'Encadreur mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'encadreur :', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'encadreur' });
    }
};

// 5. Supprimer un encadreur
exports.delete = async (pool, req, res) => {
    const encadreurId = req.params.id;
    const query = 'DELETE FROM encadreur WHERE MATRICULEENCADREUR = ?';
    try {
        const [result] = await pool.query(query, [encadreurId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Encadreur non trouvé' });
        }
        res.json({ message: 'Encadreur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'encadreur :', error);
        // Note: L'erreur peut venir d'une contrainte de clé étrangère (si l'encadreur a des stagiaires)
        res.status(500).json({ error: 'Erreur lors de la suppression. Vérifiez si l\'encadreur n\'est pas lié à des dossiers.' });
    }
};