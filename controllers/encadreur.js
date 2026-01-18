const getAll = async (req, res) => {
  try {
    const encadreurs = await req.prisma.encadreur.findMany({
      include: {
        structures: {  // ← CORRECTION ICI : "structures" au lieu de "structure"
          select: {
            IDSTRUCTURE: true,
            NOMSTRUCTURE: true,
            ABBREVIATION: true
          }
        },
        affectation: {
          include: {
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
        },
        _count: {
          select: {
            affectation: true
          }
        }
      },
      orderBy: { NOMENCADREUR: 'asc' }
    });
    
    // Formater la réponse pour inclure la hiérarchie complète
    const encadreursAvecHierarchie = await Promise.all(
      encadreurs.map(async (encadreur) => {
        let hierarchieComplete = '';
        
        // Si l'encadreur a une structure, construire la hiérarchie
        if (encadreur.structures) {
          hierarchieComplete = await getHierarchieStructure(encadreur.structures.IDSTRUCTURE, req.prisma);
        }
        
        return {
          ...encadreur,
          HIERARCHIE_COMPLETE: hierarchieComplete,
          // Compter le nombre d'étudiants actuellement encadrés
          NOMBRE_ETUDIANTS_ACTUELS: encadreur._count.affectation
        };
      })
    );
    
    res.json(encadreursAvecHierarchie);
  } catch (error) {
    console.error('Erreur récupération encadreurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des encadreurs' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const encadreur = await req.prisma.encadreur.findUnique({
      where: { IDENCADREUR: parseInt(id) },
      include: {
        structures: true,  // ← CORRECTION ICI
        affectation: {
          include: {
            dossier: {
              include: {
                etudiant: true
              }
            },
            structures: true,
            administrateur: {
              select: {
                IDADMIN: true,
                MATRICULEADMIN: true,
                NOMADMIN: true,
                PRENOMADMIN: true
              }
            }
          }
        }
      }
    });
    
    if (!encadreur) {
      return res.status(404).json({ error: 'Encadreur non trouvé' });
    }
    
    // Ajouter la hiérarchie complète
    let hierarchieComplete = '';
    if (encadreur.structures) {
      hierarchieComplete = await getHierarchieStructure(encadreur.structures.IDSTRUCTURE, req.prisma);
    }
    
    const encadreurAvecDetails = {
      ...encadreur,
      HIERARCHIE_COMPLETE: hierarchieComplete,
      // Liste des étudiants actuellement encadrés
      ETUDIANTS_ACTUELS: encadreur.affectation.map(aff => ({
        matricule: aff.dossier?.etudiant?.MATRICULEETUDIANT,
        nom: aff.dossier?.etudiant?.NOMETUDIANT,
        prenom: aff.dossier?.etudiant?.PRENOMETUDIANT,
        theme: aff.dossier?.THEME,
        etat: aff.dossier?.ETAT
      }))
    };
    
    res.json(encadreurAvecDetails);
  } catch (error) {
    console.error('Erreur récupération encadreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'encadreur' });
  }
};

const create = async (req, res) => {
  try {
    const { MATRICULEENCADREUR, NOMENCADREUR, PRENOMENCADREUR, IDSTRUCTURE, POSTE } = req.body;
    
    const nouvelEncadreur = await req.prisma.encadreur.create({
      data: {
        MATRICULEENCADREUR,
        NOMENCADREUR,
        PRENOMENCADREUR,
        IDSTRUCTURE: IDSTRUCTURE ? parseInt(IDSTRUCTURE) : null,
        POSTE
      },
      include: {
        structures: true  // ← CORRECTION ICI
      }
    });
    
    res.status(201).json(nouvelEncadreur);
  } catch (error) {
    console.error('Erreur création encadreur:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ce matricule existe déjà' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la création de l\'encadreur' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const encadreurData = req.body;
    
    // Convertir IDSTRUCTURE en nombre si présent
    if (encadreurData.IDSTRUCTURE !== undefined) {
      encadreurData.IDSTRUCTURE = encadreurData.IDSTRUCTURE ? parseInt(encadreurData.IDSTRUCTURE) : null;
    }
    
    const encadreurMisAJour = await req.prisma.encadreur.update({
      where: { IDENCADREUR: parseInt(id) },
      data: encadreurData,
      include: {
        structures: true  // ← CORRECTION ICI
      }
    });
    
    res.json(encadreurMisAJour);
  } catch (error) {
    console.error('Erreur mise à jour encadreur:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Encadreur non trouvé' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'encadreur' });
  }
};

const deleteEncadreur = async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.prisma.encadreur.delete({
      where: { IDENCADREUR: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression encadreur:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Encadreur non trouvé' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Impossible de supprimer : cet encadreur a des affectations' 
      });
    }
    
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'encadreur' });
  }
};

// --- FONCTION AUXILIAIRE : RÉCUPÉRER LA HIÉRARCHIE D'UNE STRUCTURE ---
const getHierarchieStructure = async (structureId, prisma) => {
  if (!structureId) return '';
  
  const hierachie = [];
  let currentId = structureId;
  
  while (currentId) {
    const structure = await prisma.structures.findUnique({
      where: { IDSTRUCTURE: currentId },
      select: { ABBREVIATION: true, IDPARENT: true }
    });
    
    if (!structure) break;
    
    // Ajouter au début pour avoir l'ordre racine → feuille
    hierachie.unshift(structure.ABBREVIATION);
    
    // Remplacer DG par INS
    if (structure.ABBREVIATION === 'DG') {
      hierachie[0] = 'INS';
    }
    
    currentId = structure.IDPARENT;
  }
  
  return hierachie.join('/');
};

// --- NOUVELLE FONCTION : RECHERCHER DES ENCADREURS ---
const searchEncadreurs = async (req, res) => {
  try {
    const { nom, structureId, poste } = req.query;
    
    const whereConditions = {};
    
    if (nom) {
      whereConditions.OR = [
        { NOMENCADREUR: { contains: nom, mode: 'insensitive' } },
        { PRENOMENCADREUR: { contains: nom, mode: 'insensitive' } }
      ];
    }
    
    if (structureId) {
      whereConditions.IDSTRUCTURE = parseInt(structureId);
    }
    
    if (poste) {
      whereConditions.POSTE = { contains: poste, mode: 'insensitive' };
    }
    
    const encadreurs = await req.prisma.encadreur.findMany({
      where: whereConditions,
      include: {
        structures: {
          select: {
            NOMSTRUCTURE: true,
            ABBREVIATION: true
          }
        },
        _count: {
          select: { affectation: true }
        }
      },
      orderBy: { NOMENCADREUR: 'asc' }
    });
    
    res.json(encadreurs);
  } catch (error) {
    console.error('Erreur recherche encadreurs:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche des encadreurs' });
  }
};
module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteEncadreur,
  searchEncadreurs}