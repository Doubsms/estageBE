const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de Multer pour les fichiers PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/rapports/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null,uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware pour uploader un fichier
const uploadFile = upload.single('fichierRapport');

const getAll = async (req, res) => {
  try {
    const rapports = await req.prisma.rapport.findMany({
      include: {
        // On passe par l'étudiant car c'est la seule relation connue du Rapport
        etudiant: {
          include: {
            // Depuis l'étudiant, on cherche ses dossiers
            dossier: { 
              include: {
                // Depuis le dossier, on cherche l'affectation
                affectation: {
                  include: {
                    // Depuis l'affectation, on cherche l'encadreur
                    encadreur: {
                      select: {
                        NOMENCADREUR: true,
                        PRENOMENCADREUR: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { DATE: 'desc' }
    });

    // Transformation pour simplifier l'accès aux données côté Front-end
    const rapportsTransformes = rapports.map(rapport => ({
      ...rapport,
      nomStagiaire: `${rapport.etudiant?.NOMETUDIANT} ${rapport.etudiant?.PRENOMETUDIANT}`,
      // On récupère le premier dossier (ou l'unique) de l'étudiant pour l'encadreur
      encadreur: rapport.etudiant?.dossier?.[0]?.affectation?.encadreur || null,
      fichierUrl: `${req.protocol}://${req.get('host')}/uploads/rapports/${rapport.FICHIER}`
    }));

    res.json(rapportsTransformes);
  } catch (error) {
    console.error('Erreur récupération rapports:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rapport = await req.prisma.rapport.findUnique({
      where: { IDDOSSIER: parseInt(id) },
      include: {
        dossier: {
          include: {
            etudiant: true,
            affectation: {
              include: {
                encadreur: true,
                structures: true
              }
            }
          }
        },
        etudiant: true
      }
    });
    
    if (!rapport) {
      return res.status(404).json({ error: 'Rapport non trouvé' });
    }
    
    res.json(rapport);
  } catch (error) {
    console.error('Erreur récupération rapport:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du rapport' });
  }
};

const create = async (req, res) => {
  // Utiliser le middleware d'upload
  uploadFile(req, res, async (err) => {
    if (err) {
      console.error('Erreur upload fichier:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'Le fichier est trop volumineux (max 10MB)' 
          });
        }
      }
      
      if (err.message === 'Seuls les fichiers PDF sont autorisés') {
        return res.status(400).json({ 
          error: err.message 
        });
      }
      
      return res.status(500).json({ 
        error: 'Erreur lors du téléchargement du fichier' 
      });
    }

    try {
      const { matriculeStagiaire, theme, commentaire } = req.body;
      
      // Validation des données requises
      if (!matriculeStagiaire || !theme || !commentaire) {
        // Supprimer le fichier uploadé si validation échoue
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          error: 'Tous les champs sont obligatoires' 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Veuillez télécharger un fichier PDF' 
        });
      }
      
      // Vérifier si l'étudiant existe
      const etudiant = await req.prisma.etudiant.findUnique({
        where: { MATRICULEETUDIANT: matriculeStagiaire }
      });
      
      if (!etudiant) {
        // Supprimer le fichier uploadé
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          error: 'Étudiant non trouvé' 
        });
      }
      
      // Vérifier si un rapport existe déjà pour cet étudiant
      const rapportExistant = await req.prisma.rapport.findFirst({
        where: { MATRICULE: matriculeStagiaire }
      });
      
      if (rapportExistant) {
        // Supprimer le fichier uploadé
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'Un rapport existe déjà pour cet étudiant' 
        });
      }
      
      // Créer le rapport
      const rapportData = {
        MATRICULE: matriculeStagiaire,
        THEME: theme,
        COMMENTAIRE: commentaire,
        FICHIER: req.file.filename
      };
      
      const nouveauRapport = await req.prisma.rapport.create({
        data: rapportData,
        include: {
          etudiant: {
            select: {
              NOMETUDIANT: true,
              PRENOMETUDIANT: true
            }
          }
        }
      });
      
      res.status(201).json({
        message: 'Rapport archivé avec succès',
        rapport: nouveauRapport
      });
      
    } catch (error) {
      console.error('Erreur création rapport:', error);
      
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: 'Un rapport existe déjà pour cet étudiant' 
        });
      }
      
      if (error.code === 'P2003') {
        return res.status(400).json({ 
          error: 'Étudiant non trouvé' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de la création du rapport' 
      });
    }
  });
};


const update = async (req, res) => {
  // Utiliser le middleware d'upload
  uploadFile(req, res, async (err) => {
    if (err) {
      console.error('Erreur upload fichier:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'Le fichier est trop volumineux (max 10MB)' 
          });
        }
      }
      
      if (err.message === 'Seuls les fichiers PDF sont autorisés') {
        return res.status(400).json({ 
          error: err.message 
        });
      }
      
      return res.status(500).json({ 
        error: 'Erreur lors du téléchargement du fichier' 
      });
    }

    try {
      const { id } = req.params;
      const { matriculeStagiaire, theme, commentaire } = req.body;
      
      // Vérifier si le rapport existe
      const rapportExist = await req.prisma.rapport.findUnique({
        where: { IDDOSSIER: parseInt(id) }
      });
      
      if (!rapportExist) {
        // Supprimer le fichier uploadé si rapport non trouvé
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          error: 'Rapport non trouvé' 
        });
      }
      
      // Préparer les données de mise à jour
      const updateData = {
        THEME: theme,
        COMMENTAIRE: commentaire
      };
      
      // Si un nouveau fichier est uploadé
      if (req.file) {
        // Supprimer l'ancien fichier
        const oldFilePath = path.join('uploads/rapports/', rapportExist.FICHIER);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        
        updateData.FICHIER = req.file.filename;
      }
      
      // Si le matricule change
      if (matriculeStagiaire && matriculeStagiaire !== rapportExist.MATRICULE) {
        // Vérifier si l'étudiant existe
        const etudiant = await req.prisma.etudiant.findUnique({
          where: { MATRICULEETUDIANT: matriculeStagiaire }
        });
        
        if (!etudiant) {
          // Supprimer le fichier uploadé si nouvel étudiant non trouvé
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(404).json({ 
            error: 'Nouvel étudiant non trouvé' 
          });
        }
        
        // Vérifier si un autre rapport existe pour le nouvel étudiant
        const autreRapport = await req.prisma.rapport.findFirst({
          where: { 
            MATRICULE: matriculeStagiaire,
            NOT: { IDDOSSIER: parseInt(id) }
          }
        });
        
        if (autreRapport) {
          // Supprimer le fichier uploadé
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({ 
            error: 'Un rapport existe déjà pour le nouvel étudiant' 
          });
        }
        
        updateData.MATRICULE = matriculeStagiaire;
      }
      
      // Mettre à jour le rapport
      const rapportMisAJour = await req.prisma.rapport.update({
        where: { IDDOSSIER: parseInt(id) },
        data: updateData,
        include: {
          etudiant: {
            select: {
              NOMETUDIANT: true,
              PRENOMETUDIANT: true
            }
          }
        }
      });
      
      res.json({
        message: 'Rapport mis à jour avec succès',
        rapport: rapportMisAJour
      });
      
    } catch (error) {
      console.error('Erreur mise à jour rapport:', error);
      
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: 'Rapport non trouvé' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour du rapport' 
      });
    }
  });
};

const deleteRapport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le rapport avant suppression pour supprimer le fichier
    const rapport = await req.prisma.rapport.findUnique({
      where: { IDDOSSIER: parseInt(id) }
    });
    
    if (!rapport) {
      return res.status(404).json({ 
        error: 'Rapport non trouvé' 
      });
    }
    
    // Supprimer le fichier
    const filePath = path.join('uploads/rapports/', rapport.FICHIER);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer le rapport de la base
    await req.prisma.rapport.delete({
      where: { IDDOSSIER: parseInt(id) }
    });
    
    res.status(200).json({
      message: 'Rapport supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression rapport:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Rapport non trouvé' 
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du rapport' 
    });
  }
};

// Récupérer les rapports par étudiant
const getByEtudiant = async (req, res) => {
  try {
    const { matricule } = req.params;
    
    const rapports = await req.prisma.rapport.findMany({
      where: { MATRICULE: matricule },
      include: {
        dossier: {
          include: {
            affectation: {
              include: {
                encadreur: true
              }
            }
          }
        }
      },
      orderBy: { DATE: 'desc' }
    });
    
    res.json(rapports);
  } catch (error) {
    console.error('Erreur récupération rapports par étudiant:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports' });
  }
};

// Télécharger un rapport
const downloadRapport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rapport = await req.prisma.rapport.findUnique({
      where: { IDDOSSIER: parseInt(id) }
    });
    
    if (!rapport) {
      return res.status(404).json({ 
        error: 'Rapport non trouvé' 
      });
    }
    
    const filePath = path.join(__dirname, '../../uploads/rapports/', rapport.FICHIER);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Fichier non trouvé' 
      });
    }
    
    res.download(filePath, `rapport-${rapport.MATRICULE}.pdf`);
    
  } catch (error) {
    console.error('Erreur téléchargement rapport:', error);
    res.status(500).json({ 
      error: 'Erreur lors du téléchargement du rapport' 
    });
  }
};

// Évaluer un rapport
const evaluerRapport = async (req, res) => {
  try {
    const { id } = req.params;
    const { NOTE, COMMENTAIRE } = req.body;
    
    const rapportEvalue = await req.prisma.rapport.update({
      where: { IDDOSSIER: parseInt(id) },
      data: {
        NOTE: parseFloat(NOTE),
        COMMENTAIRE: COMMENTAIRE
      }
    });
    
    res.json({
      message: 'Rapport évalué avec succès',
      rapport: rapportEvalue
    });
  } catch (error) {
    console.error('Erreur évaluation rapport:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'évaluation du rapport' 
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRapport,
  getByEtudiant,
  downloadRapport,
  evaluerRapport
};