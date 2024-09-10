// Récupérer la liste des demandes non traitées
exports.getStagiaresActuels = (connection, req, res) => {
    const query = `
      SELECT 
        e.MATRICULEETUDIANT,
        e.NOMETUDIANT, 
        e.PRENOMETUDIANT, 
        e.ETABLISSEMENT, 
        e.NIVEAU,
        e.PARCOURS,
        e.FILIERE,
        e.TEL,
        e.DATE,
        e.SEXE,
        DATE_FORMAT(d.DATEDEBUTDESEANCE, '%d/%m/%Y') AS DATEDEBUTDESEANCE, 
        DATE_FORMAT(d.DATEFINDESEANCE, '%d/%m/%Y') AS DATEFINDESEANCE, 
        d.THEME,
        d.PHOTOPROFIL,
        enc.NOMENCADREUR, 
        enc.PRENOMENCADREUR,
        enc.DEPARTEMENT,
        enc.DIVISION
    FROM etudiant e
    JOIN dossier d ON e.MATRICULEETUDIANT = d.MATRICULEETUDIANT
    JOIN attribuer a ON d.NUMERODEDOSSIER = a.IDDOSSIER
    JOIN encadreur enc ON a.MATRICULEENCADREUR = enc.MATRICULEENCADREUR
      WHERE d.ETAT = "accepté" AND d.DATEDEBUTDESEANCE <= CURRENT_DATE() AND d.DATEFINDESEANCE >= CURRENT_DATE()
    `;
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération des stagiaires actuels :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des stagiares actuels' });
        return;
      }
  
      if (results.length === 0) {
        res.status(404).json({ error: 'Aucun stagiares actuel' });
        return;
      }
  
      res.json(results);
    });
  };

 // dossierController.js
 exports.updateTheme = (connection, req, res) => {
  const { MATRICULEETUDIANT, THEME } = req.body;

  const query = `
    UPDATE dossier
    SET THEME = ?
    WHERE dossier.MATRICULEETUDIANT = ?
  `;

  connection.query(query, [THEME, MATRICULEETUDIANT], (error, result) => {
    if (error) {
      console.error('Erreur lors de la mise à jour du thème :', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du thème' });
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Aucun dossier trouvé avec cette matricule' });
      return;
    }

    res.json({ message: 'Thème mis à jour avec succès' });
  });
};

// Récupérer la liste des demandes accepté
exports.getStagiaresAccepte = (connection, req, res) => {
  // const query = `
  //   SELECT e.MATRICULEETUDIANT,e.NOMETUDIANT, e.PRENOMETUDIANT, e.ETABLISSEMENT, DATE_FORMAT(d.DATEDEBUTDESEANCE, '%d/%m/%Y') AS DATEDEBUTDESEANCE, DATE_FORMAT(d.DATEFINDESEANCE, '%d/%m/%Y') AS DATEFINDESEANCE, d.THEME
  //   FROM etudiant e
  //   JOIN dossier d ON e.MATRICULEETUDIANT = d.MATRICULEETUDIANT
  //   WHERE d.ETAT = "accepté" 
  // `;

  const query = `
    SELECT 
        e.MATRICULEETUDIANT,
        e.NOMETUDIANT, 
        e.PRENOMETUDIANT, 
        e.ETABLISSEMENT, 
        e.NIVEAU,
        e.PARCOURS,
        e.FILIERE,
        e.TEL,
        e.DATE,
        e.SEXE,
        DATE_FORMAT(d.DATEDEBUTDESEANCE, '%d/%m/%Y') AS DATEDEBUTDESEANCE, 
        DATE_FORMAT(d.DATEFINDESEANCE, '%d/%m/%Y') AS DATEFINDESEANCE, 
        d.THEME,
        d.PHOTOPROFIL,
        enc.NOMENCADREUR, 
        enc.PRENOMENCADREUR,
        enc.DEPARTEMENT,
        enc.DIVISION
    FROM etudiant e
    JOIN dossier d ON e.MATRICULEETUDIANT = d.MATRICULEETUDIANT
    JOIN attribuer a ON d.NUMERODEDOSSIER = a.IDDOSSIER
    JOIN encadreur enc ON a.MATRICULEENCADREUR = enc.MATRICULEENCADREUR
    WHERE d.ETAT = "accepté" 
`;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des stagiaires actuels :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des stagiares actuels' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Aucun stagiares actuel' });
      return;
    }

    res.json(results);
  });
};
