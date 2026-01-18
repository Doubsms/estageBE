// controllers/structures.js
const getAll = async (req, res) => {
  try {
    const structures = await req.prisma.structures.findMany({
      select: {
        IDSTRUCTURE: true,
        NOMSTRUCTURE: true,
        ABBREVIATION: true,
        IDPARENT: true,
        structures: {  // Relation vers le parent
          select: {
            IDSTRUCTURE: true,
            NOMSTRUCTURE: true,
            ABBREVIATION: true
          }
        },
        encadreur: {  // Relation vers les encadreurs
          select: {
            IDENCADREUR: true,
            MATRICULEENCADREUR: true,
            NOMENCADREUR: true,
            PRENOMENCADREUR: true,
            POSTE: true
          }
        }
      },
      orderBy: {
        NOMSTRUCTURE: 'asc'
      }
    });
    
    res.json(structures);
  } catch (error) {
    console.error('Erreur récupération structures:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des structures',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const structure = await req.prisma.structures.findUnique({
      where: { IDSTRUCTURE: parseInt(id) },
      include: {
        structures_parent: true,
        structures_children: true,
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
        }
      }
    });
    
    if (!structure) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }
    
    res.json(structure);
  } catch (error) {
    console.error('Erreur récupération structure:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la structure' });
  }
};

const create = async (req, res) => {
  try {
    const { NOMSTRUCTURE, ABBREVIATION, IDPARENT } = req.body;
    
    const nouvelleStructure = await req.prisma.structures.create({
      data: {
        NOMSTRUCTURE,
        ABBREVIATION,
        IDPARENT: IDPARENT ? parseInt(IDPARENT) : null
      }
    });
    
    res.status(201).json(nouvelleStructure);
  } catch (error) {
    console.error('Erreur création structure:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la structure' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const structureData = req.body;
    
    const structureMisAJour = await req.prisma.structures.update({
      where: { IDSTRUCTURE: parseInt(id) },
      data: structureData
    });
    
    res.json(structureMisAJour);
  } catch (error) {
    console.error('Erreur mise à jour structure:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la structure' });
  }
};

const deleteStructure = async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.prisma.structures.delete({
      where: { IDSTRUCTURE: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression structure:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la structure' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteStructure
};