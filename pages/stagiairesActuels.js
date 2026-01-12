// --- 1. RÉCUPÉRER LES STAGIAIRES ACTUELS (EN COURS DE STAGE) ---
exports.getStagiaresActuels = async (pool, req, res) => {
    const query = `
        SELECT 
            e.MATRICULEETUDIANT, e.NOMETUDIANT, e.PRENOMETUDIANT, e.ETABLISSEMENT, 
            e.NIVEAU, e.PARCOURS, e.FILIERE, e.TEL, e.DATE, e.SEXE,
            DATE_FORMAT(d.DATEDEBUTDESEANCE, '%d/%m/%Y') AS DATEDEBUTDESEANCE, 
            DATE_FORMAT(d.DATEFINDESEANCE, '%d/%m/%Y') AS DATEFINDESEANCE, 
            d.THEME, d.PHOTOPROFIL,
            enc.NOMENCADREUR, enc.PRENOMENCADREUR, enc.DEPARTEMENT, enc.DIVISION
        FROM etudiant e
        JOIN dossier d ON e.MATRICULEETUDIANT = d.MATRICULEETUDIANT
        JOIN attribuer a ON d.NUMERODEDOSSIER = a.IDDOSSIER
        JOIN encadreur enc ON a.MATRICULEENCADREUR = enc.MATRICULEENCADREUR
        WHERE d.ETAT = "accepté" 
          AND d.DATEDEBUTDESEANCE <= CURRENT_DATE() 
          AND d.DATEFINDESEANCE >= CURRENT_DATE()
    `;

    try {
        const [results] = await pool.query(query);

        if (results.length === 0) {
            return res.json([]); // Retourne un tableau vide si aucun stagiaire actuel
        }

        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        const data = results.map(s => ({
            ...s,
            PHOTOPROFIL: s.PHOTOPROFIL ? `${baseUrl}${s.PHOTOPROFIL}` : null
        }));

        res.json(data);
    } catch (error) {
        console.error('Erreur SQL Stagiaires Actuels:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des stagiaires actuels' });
    }
};

// --- 2. METTRE À JOUR LE THÈME D'UN DOSSIER ---
exports.updateTheme = async (pool, req, res) => {
    const { MATRICULEETUDIANT, THEME } = req.body;

    if (!MATRICULEETUDIANT || !THEME) {
        return res.status(400).json({ error: 'Matricule et Thème sont requis' });
    }

    const query = `
        UPDATE dossier
        SET THEME = ?
        WHERE MATRICULEETUDIANT = ?
    `;

    try {
        const [result] = await pool.query(query, [THEME, MATRICULEETUDIANT]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Aucun dossier trouvé avec ce matricule' });
        }

        res.json({ message: 'Thème mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur SQL Update Theme:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du thème' });
    }
};

// --- 3. RÉCUPÉRER TOUS LES STAGIAIRES ACCEPTÉS ---
exports.getStagiaresAccepte = async (pool, req, res) => {
    const query = `
        SELECT 
            e.MATRICULEETUDIANT, e.NOMETUDIANT, e.PRENOMETUDIANT, e.ETABLISSEMENT, 
            e.NIVEAU, e.PARCOURS, e.FILIERE, e.TEL, e.DATE, e.SEXE,
            DATE_FORMAT(d.DATEDEBUTDESEANCE, '%d/%m/%Y') AS DATEDEBUTDESEANCE, 
            DATE_FORMAT(d.DATEFINDESEANCE, '%d/%m/%Y') AS DATEFINDESEANCE, 
            d.THEME, d.PHOTOPROFIL,
            enc.NOMENCADREUR, enc.PRENOMENCADREUR, enc.DEPARTEMENT, enc.DIVISION
        FROM etudiant e
        JOIN dossier d ON e.MATRICULEETUDIANT = d.MATRICULEETUDIANT
        JOIN attribuer a ON d.NUMERODEDOSSIER = a.IDDOSSIER
        JOIN encadreur enc ON a.MATRICULEENCADREUR = enc.MATRICULEENCADREUR
        WHERE d.ETAT = "accepté"
    `;

    try {
        const [results] = await pool.query(query);

        if (results.length === 0) {
            return res.json([]);
        }

        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        const data = results.map(s => ({
            ...s,
            PHOTOPROFIL: s.PHOTOPROFIL ? `${baseUrl}${s.PHOTOPROFIL}` : null
        }));

        res.json(data);
    } catch (error) {
        console.error('Erreur SQL Stagiaires Acceptés:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des stagiaires' });
    }
};