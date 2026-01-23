exports.affectation = async (req, res) => {
  try {
    const {
      decision,
      adminemail,
      selectedSupervisor,
      dossier,
      IDSTRUCTURE
    } = req.body;
    
    // Validation
    if (!decision || !dossier || !adminemail) {
      return res.status(400).json({ success: false, error: 'Champs manquants' });
    }
    
    const admin = await req.prisma.administrateur.findFirst({
      where: { EMAILADMIN: adminemail }
    });
    
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin non trouvé' });
    }
    
    const dossierNum = parseInt(dossier, 10);
    
    // 1. Mise à jour de l'état du dossier
    await req.prisma.dossier.update({
      where: { IDDOSSIER: dossierNum },
      data: { ETAT: decision }
    });
    
    // 2. Si acceptation, créer l'affectation
    if (decision === 'accepté') {
      const encadreur = await req.prisma.encadreur.findFirst({
        where: { MATRICULEENCADREUR: selectedSupervisor }
      });
      
      if (!encadreur) {
        return res.status(404).json({ success: false, error: 'Encadreur non trouvé' });
      }
      
      await req.prisma.affectation.create({
        data: {
          IDADMIN: admin.IDADMIN,
          IDENCADREUR: encadreur.IDENCADREUR,
          IDDOSSIER: dossierNum,
          IDSTRUCTURE: parseInt(IDSTRUCTURE, 10)
        }
      });
    }
    
    // Réponse
    res.json({
      success: true,
      message: `Dossier ${decision}`,
      dossierId: dossierNum,
      decision
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({ success: false, error: 'Erreur traitement' });
  }
};