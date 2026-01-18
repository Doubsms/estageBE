const getAll = async (req, res) => {
  try {
    const affectations = await req.prisma.affectation.findMany({
      include: {
        administrateur: {
          select: {
            IDADMIN: true,
            MATRICULEADMIN: true,
            NOMADMIN: true,
            PRENOMADMIN: true
          }
        },
        encadreur: {
          select: {
            IDENCADREUR: true,
            MATRICULEENCADREUR: true,
            NOMENCADREUR: true,
            PRENOMENCADREUR: true,
            POSTE: true
          }
        },
        dossier: {
          include: {
            etudiant: {
              select: {
                MATRICULEETUDIANT: true,
                NOMETUDIANT: true,
                PRENOMETUDIANT: true
              }
            }
          }
        },
        structures: {
          select: {
            IDSTRUCTURE: true,
            NOMSTRUCTURE: true,
            ABBREVIATION: true
          }
        }
      },
      orderBy: {
        dossier: {
          IDDOSSIER: 'desc'
        }
      }
    });
    
    res.json(affectations);
  } catch (error) {
    console.error('Erreur récupération affectations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des affectations' });
  }
};

const getById = async (req, res) => {
  try {
    const { idAdmin, idEncadreur, idDossier, idStructure } = req.params;
    
    const affectation = await req.prisma.affectation.findUnique({
      where: {
        IDADMIN_IDENCADREUR_IDDOSSIER_IDSTRUCTURE: {
          IDADMIN: parseInt(idAdmin),
          IDENCADREUR: parseInt(idEncadreur),
          IDDOSSIER: parseInt(idDossier),
          IDSTRUCTURE: parseInt(idStructure)
        }
      },
      include: {
        administrateur: true,
        encadreur: true,
        dossier: {
          include: {
            etudiant: true
          }
        },
        structures: true
      }
    });
    
    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvée' });
    }
    
    res.json(affectation);
  } catch (error) {
    console.error('Erreur récupération affectation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'affectation' });
  }
};

const create = async (req, res) => {
  try {
    const { IDADMIN, IDENCADREUR, IDDOSSIER, IDSTRUCTURE } = req.body;
    
    // Vérifier si l'encadreur est disponible
    const encadreur = await req.prisma.encadreur.findUnique({
      where: { IDENCADREUR: parseInt(IDENCADREUR) },
      include: {
        _count: {
          select: {
            affectation: true
          }
        }
      }
    });
    
    if (!encadreur) {
      return res.status(404).json({ error: 'Encadreur non trouvé' });
    }
    
    // Vérifier si le dossier existe
    const dossier = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: parseInt(IDDOSSIER) }
    });
    
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    
    // Vérifier si la structure existe
    const structure = await req.prisma.structures.findUnique({
      where: { IDSTRUCTURE: parseInt(IDSTRUCTURE) }
    });
    
    if (!structure) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }
    
    // Créer l'affectation
    const nouvelleAffectation = await req.prisma.affectation.create({
      data: {
        IDADMIN: parseInt(IDADMIN),
        IDENCADREUR: parseInt(IDENCADREUR),
        IDDOSSIER: parseInt(IDDOSSIER),
        IDSTRUCTURE: parseInt(IDSTRUCTURE)
      },
      include: {
        administrateur: {
          select: {
            NOMADMIN: true,
            PRENOMADMIN: true
          }
        },
        encadreur: true,
        dossier: {
          include: {
            etudiant: true
          }
        },
        structures: true
      }
    });
    
    // Mettre à jour l'état du dossier
    await req.prisma.dossier.update({
      where: { IDDOSSIER: parseInt(IDDOSSIER) },
      data: { ETAT: 'accepte' }
    });
    
    res.status(201).json({
      message: 'Affectation créée avec succès',
      affectation: nouvelleAffectation
    });
    
  } catch (error) {
    console.error('Erreur création affectation:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Cette affectation existe déjà' 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Référence invalide. Vérifiez les IDs' 
      });
    }
    
    res.status(500).json({ error: 'Erreur lors de la création de l\'affectation' });
  }
};

const deleteAffectation = async (req, res) => {
  try {
    const { idAdmin, idEncadreur, idDossier, idStructure } = req.params;
    
    await req.prisma.affectation.delete({
      where: {
        IDADMIN_IDENCADREUR_IDDOSSIER_IDSTRUCTURE: {
          IDADMIN: parseInt(idAdmin),
          IDENCADREUR: parseInt(idEncadreur),
          IDDOSSIER: parseInt(idDossier),
          IDSTRUCTURE: parseInt(idStructure)
        }
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression affectation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Affectation non trouvée' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'affectation' });
  }
};

// Récupérer les affectations par encadreur
const getByEncadreur = async (req, res) => {
  try {
    const { idEncadreur } = req.params;
    
    const affectations = await req.prisma.affectation.findMany({
      where: { IDENCADREUR: parseInt(idEncadreur) },
      include: {
        dossier: {
          include: {
            etudiant: true
          }
        },
        structures: true
      }
    });
    
    res.json(affectations);
  } catch (error) {
    console.error('Erreur récupération affectations par encadreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des affectations' });
  }
};

// Récupérer les affectations par dossier
const getByDossier = async (req, res) => {
  try {
    const { idDossier } = req.params;
    
    const affectations = await req.prisma.affectation.findMany({
      where: { IDDOSSIER: parseInt(idDossier) },
      include: {
        encadreur: true,
        structures: true,
        administrateur: {
          select: {
            NOMADMIN: true,
            PRENOMADMIN: true
          }
        }
      }
    });
    
    res.json(affectations);
  } catch (error) {
    console.error('Erreur récupération affectations par dossier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des affectations' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  delete: deleteAffectation,
  getByEncadreur,
  getByDossier
};