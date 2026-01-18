// Récupérer le profil de l'administrateur
exports.getprofile = async (req, res) => {
  const { adminemail } = req.body; 

  // Validation de l'entrée
  if (!adminemail) {
    return res.status(400).json({ error: 'L\'email de l\'administrateur est requis' });
  }

  try {
    // Rechercher l'administrateur avec Prisma
    const adminData = await req.prisma.administrateur.findFirst({
      where: { EMAILADMIN: adminemail },
      select: {
        MATRICULEADMIN: true,
        NOMADMIN: true,
        PRENOMADMIN: true,
        EMAILADMIN: true,
        PHOTOADMIN: true,
        IDADMIN: true
      }
    });

    if (!adminData) {
      return res.status(404).json({ error: 'Administrateur non trouvé avec cet email' });
    }

    // Construction de l'URL complète pour la photo de profil
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    const profile = {
      ...adminData,
      PHOTOADMIN: adminData.PHOTOADMIN ? `${baseUrl}/uploads/${adminData.PHOTOADMIN}` : null,
      // Ajout d'informations supplémentaires si besoin
      FULL_NAME: `${adminData.NOMADMIN} ${adminData.PRENOMADMIN}`,
      ROLE: 'Administrateur'
    };

    // Envoyer les données formatées en réponse
    return res.status(200).json(profile);

  } catch (error) {
    console.error('Erreur lors de la récupération du profil administrateur :', error);
    
    // Gestion des erreurs spécifiques de Prisma
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Administrateur non trouvé' });
    }
    
    return res.status(500).json({ 
      error: 'Une erreur serveur est survenue lors de la récupération du profil',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};