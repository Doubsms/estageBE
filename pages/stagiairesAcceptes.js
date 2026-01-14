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