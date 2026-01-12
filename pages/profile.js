// Récupérer le profil de l'administrateur
exports.getprofile = async (pool, req, res) => {
  const { adminemail } = req.body; 

  // Validation de l'entrée
  if (!adminemail) {
    return res.status(400).json({ error: 'L\'email de l\'administrateur est requis' });
  }

  const query = `
    SELECT MATRICULEADMIN, NOMADMIN, PRENOMADMIN, EMAILADMIN, PHOTOADMIN 
    FROM administrateur 
    WHERE EMAILADMIN = ?
  `;

  try {
    // Exécution de la requête avec await
    const [results] = await pool.query(query, [adminemail]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Administrateur non trouvé avec cet email' });
    }

    // Récupération des données
    const adminData = results[0];

    // Construction de l'URL complète pour la photo de profil
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    const profile = {
      ...adminData,
      PHOTOADMIN: adminData.PHOTOADMIN ? `${baseUrl}${adminData.PHOTOADMIN}` : null
    };

    // Envoyer les données formatées en réponse
    return res.status(200).json(profile);

  } catch (error) {
    console.error('Erreur lors de la récupération du profil administrateur :', error);
    return res.status(500).json({ 
      error: 'Une erreur serveur est survenue lors de la récupération du profil' 
    });
  }
};