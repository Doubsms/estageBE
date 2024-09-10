exports.getprofile = (connection, req, res) => {
    const { adminemail } = req.body; // Utiliser req.body pour recevoir les données
    const getAdminQuery = 'SELECT MATRICULEADMIN, NOMADMIN, PRENOMADMIN, EMAILADMIN, PHOTOADMIN FROM administrateur WHERE EMAILADMIN = ?';
  
    // Récupérer le matricule de l'administrateur à partir de son email
    connection.query(getAdminQuery, [adminemail], (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération du matricule de l\'administrateur :', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du matricule de l\'administrateur' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Administrateur non trouvé avec cet email' });
      }
  
      const adminData = results[0]; // Récupérer les données de l'administrateur
      return res.status(200).json(adminData); // Envoyer les données de l'administrateur en réponse
    });
  };