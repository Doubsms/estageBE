const getAll = async (req, res) => {
  try {
    const etudiants = await req.prisma.etudiant.findMany({
      include: {
        dossier: {
          include: {
            affectation: {
              include: {
                encadreur: {
                  select: {
                    NOMENCADREUR: true,
                    PRENOMENCADREUR: true
                  }
                },
                structures: {
                  select: {
                    NOMSTRUCTURE: true
                  }
                }
              }
            },
            rapport: true
          }
        },
        _count: {
          select: {
            dossier: true
          }
        }
      },
      orderBy: { DATE: 'desc' }
    });
    
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur récupération étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des étudiants' });
  }
};

const getByMatricule = async (req, res) => {
  try {
    const { matricule } = req.params;
    
    const etudiant = await req.prisma.etudiant.findUnique({
      where: { MATRICULEETUDIANT: matricule },
      include: {
        dossier: {
          include: {
            affectation: {
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
            },
            rapport: true
          },
          orderBy: { IDDOSSIER: 'desc' }
        }
      }
    });
    
    if (!etudiant) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    
    res.json(etudiant);
  } catch (error) {
    console.error('Erreur récupération étudiant:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'étudiant' });
  }
};

const create = async (req, res) => {
 
  console.log("données réçues:", req.body);

  try {
    const etudiantData = req.body;
    const { MATRICULEETUDIANT } = etudiantData;
    
    if (!MATRICULEETUDIANT) {
      return res.status(400).json({
        success: false,
        error: 'Matricule étudiant requis'
      });
    }
    
    // Vérifier si l'étudiant existe déjà
    const etudiantExistant = await req.prisma.etudiant.findUnique({
      where: { MATRICULEETUDIANT: MATRICULEETUDIANT }
    });
    
    let etudiant;
    let estNouveau = false;
    
    // Filtrer les champs undefined/null
    const cleanedData = {};
    Object.keys(etudiantData).forEach(key => {
      if (etudiantData[key] !== undefined && etudiantData[key] !== null) {
        cleanedData[key] = etudiantData[key];
      }
    });
    
    if (etudiantExistant) {
      // Mettre à jour l'étudiant existant
      // Ajouter la date de mise à jour
      cleanedData.DATE = new Date();
      
      etudiant = await req.prisma.etudiant.update({
        where: { MATRICULEETUDIANT: MATRICULEETUDIANT },
        data: cleanedData
      });
      
      console.log(`✅ Étudiant mis à jour: ${MATRICULEETUDIANT}`);
    } else {
      // Créer un nouvel étudiant
      estNouveau = true;
      
      // S'assurer que tous les champs requis sont présents
      const requiredFields = ['NOMETUDIANT', 'PRENOMETUDIANT', 'EMAIL', 'TEL', 'SEXE'];
      const missingFields = requiredFields.filter(field => !cleanedData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants pour la création',
          missingFields
        });
      }
      
      cleanedData.DATE = new Date();
      
      etudiant = await req.prisma.etudiant.create({
        data: cleanedData
      });
      
      console.log(`✅ Nouvel étudiant créé: ${MATRICULEETUDIANT}`);
    }
    
    res.status(estNouveau ? 201 : 200).json({
      success: true,
      message: estNouveau ? 'Étudiant créé avec succès' : 'Étudiant mis à jour avec succès',
      etudiant: {
        matricule: etudiant.MATRICULEETUDIANT,
        nom: etudiant.NOMETUDIANT,
        prenom: etudiant.PRENOMETUDIANT,
        email: etudiant.EMAIL,
        tel: etudiant.TEL,
        date: etudiant.DATE
      },
      estNouveau: estNouveau
    });
  } catch (error) {
    console.error('Erreur création/mise à jour étudiant:', error);
    
    // Gestion des erreurs Prisma
    let errorMessage = 'Erreur lors du traitement de l\'étudiant';
    let statusCode = 500;
    
    switch (error.code) {
      case 'P2002':
        errorMessage = 'Ce matricule existe déjà';
        statusCode = 400;
        break;
      case 'P2025':
        errorMessage = 'Étudiant non trouvé';
        statusCode = 404;
        break;
      case 'P2003':
        errorMessage = 'Violation de contrainte de clé étrangère';
        statusCode = 400;
        break;
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const update = async (req, res) => {
  try {
    const { matricule } = req.params;
    const etudiantData = req.body;
    
    const etudiantMisAJour = await req.prisma.etudiant.update({
      where: { MATRICULEETUDIANT: matricule },
      data: etudiantData
    });
    
    res.json({
      message: 'Étudiant mis à jour avec succès',
      etudiant: etudiantMisAJour
    });
  } catch (error) {
    console.error('Erreur mise à jour étudiant:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'étudiant' });
  }
};

const deleteEtudiant = async (req, res) => {
  try {
    const { matricule } = req.params;
    
    await req.prisma.etudiant.delete({
      where: { MATRICULEETUDIANT: matricule }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression étudiant:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Impossible de supprimer : cet étudiant a des dossiers' 
      });
    }
    
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'étudiant' });
  }
};

// Rechercher des étudiants
const search = async (req, res) => {
  try {
    const { q } = req.query;
    
    const etudiants = await req.prisma.etudiant.findMany({
      where: {
        OR: [
          { MATRICULEETUDIANT: { contains: q, mode: 'insensitive' } },
          { NOMETUDIANT: { contains: q, mode: 'insensitive' } },
          { PRENOMETUDIANT: { contains: q, mode: 'insensitive' } },
          { EMAIL: { contains: q, mode: 'insensitive' } },
          { FILIERE: { contains: q, mode: 'insensitive' } },
          { ETABLISSEMENT: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20,
      orderBy: { NOMETUDIANT: 'asc' }
    });
    
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur recherche étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche des étudiants' });
  }
};

// Récupérer les étudiants par filière
const getByFiliere = async (req, res) => {
  try {
    const { filiere } = req.params;
    
    const etudiants = await req.prisma.etudiant.findMany({
      where: { FILIERE: filiere },
      include: {
        dossier: {
          select: {
            IDDOSSIER: true,
            THEME: true,
            ETAT: true
          }
        }
      }
    });
    
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur récupération étudiants par filière:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des étudiants' });
  }
};

module.exports = {
  getAll,
  getByMatricule,
  create,
  update,
  delete: deleteEtudiant,
  search,
  getByFiliere
};