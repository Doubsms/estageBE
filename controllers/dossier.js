const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware pour les fichiers multiples
const handleFileUpload = upload.fields([
  { name: 'CNI', maxCount: 1 },
  { name: 'CERTIFICAT', maxCount: 1 },
  { name: 'LETTREMOTIVATION', maxCount: 1 },
  { name: 'LETTRERECOMMENDATION', maxCount: 1 },
  { name: 'PHOTOPROFIL', maxCount: 1 },
  { name: 'CV', maxCount: 1 },               // 👈 Ajout CV
  { name: 'CAHIERDECHARGE', maxCount: 1 }    // 👈 Ajout Cahier de charge
]);

// 1. Récupérer tous les dossiers
exports.getAll = async (req, res) => {
  try {
    const dossiers = await req.prisma.dossier.findMany({
      include: {
        etudiant: {
          select: {
            MATRICULEETUDIANT: true,
            NOMETUDIANT: true,
            PRENOMETUDIANT: true,
            ETABLISSEMENT: true,
            FILIERE: true,
            NIVEAU: true
          }
        }
      },
      orderBy: { IDDOSSIER: 'desc' }
    });
    
    res.json(dossiers);
  } catch (error) {
    console.error('Erreur récupération dossiers:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' });
  }
};

// 2. Récupérer un dossier par ID
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const dossier = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: id },
      include: {
        etudiant: true
      }
    });
    
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    
    res.json(dossier);
  } catch (error) {
    console.error('Erreur récupération dossier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du dossier' });
  }
};

// 3. Créer un nouveau dossier (Multi-fichiers) - SIMPLE ENREGISTREMENT
exports.create = async (req, res) => {
  // Multer middleware
  handleFileUpload(req, res, async (err) => {
    if (err) {
      console.error('Erreur Multer:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors du téléchargement des fichiers' 
      });
    }

    try {
      const { MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE } = req.body;
      const files = req.files || {};

      // Créer directement le dossier sans vérifier l'existence de l'étudiant
      // (on suppose que l'étudiant a déjà été créé)
      const dossierData = {
        MATRICULEETUDIANT,
        DATEDEBUTDESEANCE: DATEDEBUTDESEANCE ? new Date(DATEDEBUTDESEANCE) : null,
        DATEFINDESEANCE: DATEFINDESEANCE ? new Date(DATEFINDESEANCE) : null,
        ETAT: 'non traité'
      };

      // Ajouter les chemins des fichiers
      if (files.CNI && files.CNI[0]) dossierData.CNI = files.CNI[0].filename;
      if (files.CERTIFICAT && files.CERTIFICAT[0]) dossierData.CERTIFICAT = files.CERTIFICAT[0].filename;
      if (files.LETTREMOTIVATION && files.LETTREMOTIVATION[0]) dossierData.LETTREMOTIVATION = files.LETTREMOTIVATION[0].filename;
      if (files.LETTRERECOMMENDATION && files.LETTRERECOMMENDATION[0]) dossierData.LETTRERECOMMENDATION = files.LETTRERECOMMENDATION[0].filename;
      if (files.PHOTOPROFIL && files.PHOTOPROFIL[0]) dossierData.PHOTOPROFIL = files.PHOTOPROFIL[0].filename;
      if (files.CV && files.CV[0]) dossierData.CV = files.CV[0].filename;                                        // 👈 Ajout CV
      if (files.CAHIERDECHARGE && files.CAHIERDECHARGE[0]) dossierData.CAHIERDECHARGE = files.CAHIERDECHARGE[0].filename; // 👈 Ajout Cahier de charge

      // Créer le dossier
      const nouveauDossier = await req.prisma.dossier.create({
        data: dossierData
      });

      console.log(`✅ Nouveau dossier créé: ID ${nouveauDossier.IDDOSSIER} pour ${MATRICULEETUDIANT}`);

      res.status(201).json({
        success: true,
        message: 'Dossier créé avec succès',
        data: {
          dossierId: nouveauDossier.IDDOSSIER,
          matricule: nouveauDossier.MATRICULEETUDIANT,
          etat: nouveauDossier.ETAT
        }
      });

    } catch (error) {
      console.error('Erreur création dossier:', error);
      
      // Nettoyer les fichiers en cas d'erreur
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      
      let errorMessage = 'Erreur lors de la création du dossier';
      let statusCode = 500;
      
      if (error.code === 'P2003') {
        errorMessage = 'Étudiant non trouvé. Vérifiez le matricule';
        statusCode = 400;
      }
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage
      });
    }
  });
};

// 4. Mettre à jour un dossier
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { MATRICULEETUDIANT, DATEDEBUTDESEANCE, DATEFINDESEANCE, ETAT } = req.body;
    
    const dossier = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: id }
    });
    
    if (!dossier) {
      return res.status(404).json({ 
        success: false,
        error: 'Dossier non trouvé' 
      });
    }
    
    const dossierMisAJour = await req.prisma.dossier.update({
      where: { IDDOSSIER: id },
      data: {
        MATRICULEETUDIANT,
        DATEDEBUTDESEANCE: DATEDEBUTDESEANCE ? new Date(DATEDEBUTDESEANCE) : null,
        DATEFINDESEANCE: DATEFINDESEANCE ? new Date(DATEFINDESEANCE) : null,
        ETAT
      },
      include: { etudiant: true }
    });
    
    res.json({
      success: true,
      message: 'Dossier mis à jour avec succès',
      data: dossierMisAJour
    });
  } catch (error) {
    console.error('Erreur mise à jour dossier:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'Dossier non trouvé' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour du dossier' 
    });
  }
};

// 5. Supprimer un dossier
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Vérifier si le dossier existe
    const dossier = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: id }
    });
    
    if (!dossier) {
      return res.status(404).json({ 
        success: false,
        error: 'Dossier non trouvé' 
      });
    }
    
    // Supprimer les fichiers associés s'ils existent
    const fichiers = ['CNI', 'CERTIFICAT', 'LETTREMOTIVATION', 'LETTRERECOMMENDATION', 'PHOTOPROFIL', 'CV', 'CAHIERDECHARGE']; // 👈 Ajout CV et CAHIERDECHARGE
    fichiers.forEach(champ => {
      if (dossier[champ]) {
        const filePath = path.join('uploads/', dossier[champ]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
    
    // Supprimer le dossier de la base
    await req.prisma.dossier.delete({
      where: { IDDOSSIER: id }
    });
    
    res.json({
      success: true,
      message: 'Dossier supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression dossier:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'Dossier non trouvé' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression du dossier' 
    });
  }
};

// 6. Mettre à jour seulement l'état d'un dossier
exports.updateEtat = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { ETAT } = req.body;
    
    const dossier = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: id }
    });
    
    if (!dossier) {
      return res.status(404).json({ 
        success: false,
        error: 'Dossier non trouvé' 
      });
    }
    
    const dossierMisAJour = await req.prisma.dossier.update({
      where: { IDDOSSIER: id },
      data: { ETAT }
    });
    
    res.json({
      success: true,
      message: 'État du dossier mis à jour',
      data: dossierMisAJour
    });
  } catch (error) {
    console.error('Erreur mise à jour état dossier:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour de l\'état du dossier' 
    });
  }
};