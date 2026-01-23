const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Configuration de Multer pour les fichiers PDF des lettres d'acceptation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/lettreacceptation/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `lettre_acceptation_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF, JPG, JPEG, PNG sont autorisés'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware pour uploader un fichier de lettre d'acceptation
const uploadLettreAcceptation = upload.single('lettreAcceptation');

// Fonction pour envoyer l'email d'acceptation de stage
async function sendAcceptationEmail(etudiant, dossier, fichierLettre) {
  try {
    // Vérifier si le fichier existe
    const filePath = path.join('uploads/lettreacceptation/', fichierLettre);
    if (!fs.existsSync(filePath)) {
      console.error('Fichier lettre non trouvé:', filePath);
      return { success: false, error: 'Fichier lettre non trouvé' };
    }

    const periodeStage = dossier.DATEDEBUTDESEANCE && dossier.DATEFINDESEANCE 
      ? `Du ${new Date(dossier.DATEDEBUTDESEANCE).toLocaleDateString('fr-FR')} au ${new Date(dossier.DATEFINDESEANCE).toLocaleDateString('fr-FR')}`
      : 'À définir';

    const dateFormatted = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 25px; border: 2px solid #2e7d32; border-radius: 12px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #2e7d32; margin-bottom: 10px; font-size: 28px;">🎉 FÉLICITATIONS !</h1>
          <h2 style="color: #2c3e50; font-size: 22px;">Votre demande de stage a été acceptée</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Cher(e) <strong>${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Nous avons le plaisir de vous informer que votre demande de stage a été <strong style="color: #2e7d32;">approuvée</strong>.
        </p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2e7d32;">
          <p style="margin: 0; font-weight: bold; color: #2e7d32; font-size: 17px;">📋 Détails de votre stage</p>
          <div style="margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>Matricule :</strong> ${etudiant.MATRICULEETUDIANT}</p>
            <p style="margin: 8px 0;"><strong>Période de stage :</strong> ${periodeStage}</p>
            <p style="margin: 8px 0;"><strong>Date d'approbation :</strong> ${dateFormatted}</p>
            ${dossier.THEME ? `<p style="margin: 8px 0;"><strong>Thème :</strong> ${dossier.THEME}</p>` : ''}
          </div>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 18px; border-radius: 10px; margin: 20px 0; border: 1px solid #2196f3;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1565c0;">
            📎 Pièce jointe
          </p>
          <p style="margin: 0; color: #333;">
            Votre lettre d'acceptation officielle est jointe à cet email au format PDF.
            <br><em style="color: #666; font-size: 14px;">Conservez précieusement ce document.</em>
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <p style="font-weight: bold; color: #2c3e50; margin-bottom: 15px;">📝 Prochaines étapes :</p>
          <ol style="padding-left: 20px; color: #333;">
            <li style="margin-bottom: 8px;">Consultez votre lettre d'acceptation jointe</li>
            <li style="margin-bottom: 8px;">Contactez votre encadreur pédagogique</li>
            <li style="margin-bottom: 8px;">Préparez votre convention de stage</li>
            <li>Démarrez votre stage selon la période prévue</li>
          </ol>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Nous vous souhaitons un excellent stage riche en apprentissages et en expériences professionnelles.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 15px; color: #2c3e50; font-weight: bold; margin-bottom: 5px;">
            Cordialement,
          </p>
          <p style="font-size: 16px; color: #2e7d32; font-weight: bold; margin: 0;">
            Le Service des Stages
          </p>
          <p style="font-size: 14px; color: #666; font-style: italic; margin-top: 5px;">
            Institut National du Sport du Cameroun
          </p>
        </div>
      </div>
    `;

    const plainText = `
FÉLICITATIONS ! VOTRE DEMANDE DE STAGE A ÉTÉ ACCEPTÉE
Institut National de la Statistique du Cameroun

Cher(e) ${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT},

Nous avons le plaisir de vous informer que votre demande de stage professionnel a été approuvée.

DÉTAILS DE VOTRE STAGE :
- Matricule : ${etudiant.MATRICULEETUDIANT}
- Période : ${periodeStage}
- Date d'approbation : ${dateFormatted}
${dossier.THEME ? `- Thème : ${dossier.THEME}\n` : ''}

Votre lettre d'acceptation officielle est jointe à cet email au format PDF.

PROCHAINES ÉTAPES :
1. Consultez votre lettre d'acceptation jointe
2. Contactez votre encadreur pédagogique
3. Préparez votre convention de stage
4. Démarrez votre stage selon la période prévue

Nous vous souhaitons un excellent stage riche en apprentissages et en expériences professionnelles.

Cordialement,
Le Service des Stages et Developpement des compétences
Institut National de la Statistique du Cameroun
    `;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'inscamerounstage@gmail.com',
        pass: 'cdtfhjfuzxjirues'
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    const mailOptions = {
      from: '"Service des Stages - INS Cameroun" <inscamerounstage@gmail.com>',
      to: etudiant.EMAIL,
      subject: `🎉 [INS Cameroun] Acceptation de votre stage - ${etudiant.MATRICULEETUDIANT}`,
      text: plainText,
      html: htmlContent,
      attachments: [{
        filename: `Lettre_Acceptation_${etudiant.MATRICULEETUDIANT}${path.extname(fichierLettre)}`,
        path: filePath,
        contentType: filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
      }],
      replyTo: 'inscamerounstage@gmail.com'
    };

    console.log(`📨 Envoi email d'acceptation à: ${etudiant.EMAIL}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email d\'acceptation envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      email: etudiant.EMAIL
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi email d\'acceptation:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

const getAll = async (req, res) => {
  try {
    const lettresAcceptation = await req.prisma.lettreAcceptation.findMany({
      include: {
        dossier: {
          include: {
            etudiant: {
              select: {
                NOMETUDIANT: true,
                PRENOMETUDIANT: true,
                MATRICULEETUDIANT: true,
                EMAIL: true
              }
            }
          }
        }
      },
      orderBy: { DATEUPLOAD: 'desc' }
    });

    const lettresTransformees = lettresAcceptation.map(lettre => ({
      ...lettre,
      nomEtudiant: `${lettre.dossier?.etudiant?.NOMETUDIANT} ${lettre.dossier?.etudiant?.PRENOMETUDIANT}`,
      matricule: lettre.dossier?.etudiant?.MATRICULEETUDIANT,
      emailEtudiant: lettre.dossier?.etudiant?.EMAIL,
      fichierUrl: lettre.FICHIER ? `${req.protocol}://${req.get('host')}/uploads/lettreacceptation/${lettre.FICHIER}` : null
    }));

    res.json(lettresTransformees);
  } catch (error) {
    console.error('Erreur récupération lettres d\'acceptation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des lettres d\'acceptation' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lettreAcceptation = await req.prisma.lettreAcceptation.findUnique({
      where: { IDLETTRE: parseInt(id) },
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
        }
      }
    });
    
    if (!lettreAcceptation) {
      return res.status(404).json({ error: 'Lettre d\'acceptation non trouvée' });
    }
    
    res.json(lettreAcceptation);
  } catch (error) {
    console.error('Erreur récupération lettre d\'acceptation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la lettre d\'acceptation' });
  }
};

const create = async (req, res) => {
  uploadLettreAcceptation(req, res, async (err) => {
    if (err) {
      console.error('Erreur upload fichier:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'Le fichier est trop volumineux (max 10MB)' 
          });
        }
      }
      
      if (err.message === 'Seuls les fichiers PDF, JPG, JPEG, PNG sont autorisés') {
        return res.status(400).json({ 
          error: err.message 
        });
      }
      
      return res.status(500).json({ 
        error: 'Erreur lors du téléchargement du fichier' 
      });
    }

    try {
      const { IDDOSSIER, COMMENTAIRE } = req.body;
      
      if (!IDDOSSIER || !COMMENTAIRE) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          error: 'Tous les champs sont obligatoires' 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Veuillez télécharger une lettre d\'acceptation' 
        });
      }
      
      const dossier = await req.prisma.dossier.findUnique({
        where: { IDDOSSIER: parseInt(IDDOSSIER) },
        include: {
          etudiant: true
        }
      });
      
      if (!dossier) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          error: 'Dossier non trouvé' 
        });
      }
      
      const lettreExistant = await req.prisma.lettreAcceptation.findFirst({
        where: { IDDOSSIER: parseInt(IDDOSSIER) }
      });
      
      if (lettreExistant) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          error: 'Une lettre d\'acceptation existe déjà pour ce dossier' 
        });
      }
      
      const lettreData = {
        IDDOSSIER: parseInt(IDDOSSIER),
        COMMENTAIRE: COMMENTAIRE,
        FICHIER: req.file.filename,
        DATEUPLOAD: new Date(),
        EMAILSENT: false
      };
      
      const nouvelleLettre = await req.prisma.lettreAcceptation.create({
        data: lettreData,
        include: {
          dossier: {
            include: {
              etudiant: {
                select: {
                  NOMETUDIANT: true,
                  PRENOMETUDIANT: true,
                  MATRICULEETUDIANT: true,
                  EMAIL: true
                }
              }
            }
          }
        }
      });
      
      let emailResult = null;
      try {
        emailResult = await sendAcceptationEmail(
          nouvelleLettre.dossier.etudiant,
          dossier,
          req.file.filename
        );
        
        if (emailResult.success) {
          await req.prisma.lettreAcceptation.update({
            where: { IDLETTRE: nouvelleLettre.IDLETTRE },
            data: { EMAILSENT: true }
          });
          console.log('✅ EMAILSENT mis à jour à true');
        }
      } catch (emailError) {
        console.warn('⚠️ Email non envoyé:', emailError.message);
      }
      
      res.status(201).json({
        message: 'Lettre d\'acceptation archivée avec succès',
        lettreAcceptation: {
          ...nouvelleLettre,
          EMAILSENT: emailResult?.success || false
        },
        emailSent: emailResult?.success || false,
        emailInfo: emailResult
      });
      
    } catch (error) {
      console.error('Erreur création lettre d\'acceptation:', error);
      
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: 'Une lettre d\'acceptation existe déjà pour ce dossier' 
        });
      }
      
      if (error.code === 'P2003') {
        return res.status(400).json({ 
          error: 'Dossier non trouvé' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de la création de la lettre d\'acceptation' 
      });
    }
  });
};

const update = async (req, res) => {
  uploadLettreAcceptation(req, res, async (err) => {
    if (err) {
      console.error('Erreur upload fichier:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'Le fichier est trop volumineux (max 10MB)' 
          });
        }
      }
      
      if (err.message === 'Seuls les fichiers PDF, JPG, JPEG, PNG sont autorisés') {
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
      const { COMMENTAIRE } = req.body;
      
      const lettreExist = await req.prisma.lettreAcceptation.findUnique({
        where: { IDLETTRE: parseInt(id) }
      });
      
      if (!lettreExist) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          error: 'Lettre d\'acceptation non trouvée' 
        });
      }
      
      const updateData = {
        COMMENTAIRE: COMMENTAIRE
      };
      
      if (req.file) {
        const oldFilePath = path.join('uploads/lettreacceptation/', lettreExist.FICHIER);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        
        updateData.FICHIER = req.file.filename;
        updateData.DATEUPLOAD = new Date();
        updateData.EMAILSENT = false;
      }
      
      const lettreMisAJour = await req.prisma.lettreAcceptation.update({
        where: { IDLETTRE: parseInt(id) },
        data: updateData,
        include: {
          dossier: {
            include: {
              etudiant: {
                select: {
                  NOMETUDIANT: true,
                  PRENOMETUDIANT: true,
                  MATRICULEETUDIANT: true,
                  EMAIL: true
                }
              }
            }
          }
        }
      });
      
      res.json({
        message: 'Lettre d\'acceptation mise à jour avec succès',
        lettreAcceptation: lettreMisAJour
      });
      
    } catch (error) {
      console.error('Erreur mise à jour lettre d\'acceptation:', error);
      
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: 'Lettre d\'acceptation non trouvée' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la lettre d\'acceptation' 
      });
    }
  });
};

const deleteLettreAcceptation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lettreAcceptation = await req.prisma.lettreAcceptation.findUnique({
      where: { IDLETTRE: parseInt(id) }
    });
    
    if (!lettreAcceptation) {
      return res.status(404).json({ 
        error: 'Lettre d\'acceptation non trouvée' 
      });
    }
    
    if (lettreAcceptation.FICHIER) {
      const filePath = path.join('uploads/lettreacceptation/', lettreAcceptation.FICHIER);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await req.prisma.lettreAcceptation.delete({
      where: { IDLETTRE: parseInt(id) }
    });
    
    res.status(200).json({
      message: 'Lettre d\'acceptation supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression lettre d\'acceptation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Lettre d\'acceptation non trouvée' 
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la lettre d\'acceptation' 
    });
  }
};

const getByDossier = async (req, res) => {
  try {
    const { idDossier } = req.params;
    
    const lettresAcceptation = await req.prisma.lettreAcceptation.findMany({
      where: { IDDOSSIER: parseInt(idDossier) },
      include: {
        dossier: {
          include: {
            etudiant: {
              select: {
                NOMETUDIANT: true,
                PRENOMETUDIANT: true,
                MATRICULEETUDIANT: true,
                EMAIL: true
              }
            }
          }
        }
      },
      orderBy: { DATEUPLOAD: 'desc' }
    });
    
    res.json(lettresAcceptation);
  } catch (error) {
    console.error('Erreur récupération lettres d\'acceptation par dossier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des lettres d\'acceptation' });
  }
};

const downloadLettreAcceptation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lettreAcceptation = await req.prisma.lettreAcceptation.findUnique({
      where: { IDLETTRE: parseInt(id) },
      include: {
        dossier: {
          include: {
            etudiant: true
          }
        }
      }
    });
    
    if (!lettreAcceptation) {
      return res.status(404).json({ 
        error: 'Lettre d\'acceptation non trouvée' 
      });
    }
    
    if (!lettreAcceptation.FICHIER) {
      return res.status(404).json({ 
        error: 'Fichier non disponible' 
      });
    }
    
    const filePath = path.join(__dirname, '../uploads/lettreacceptation/', lettreAcceptation.FICHIER);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Fichier non trouvé sur le serveur' 
      });
    }
    
    const nomFichier = `lettre_acceptation_${lettreAcceptation.dossier?.etudiant?.MATRICULEETUDIANT || lettreAcceptation.IDLETTRE}${path.extname(lettreAcceptation.FICHIER)}`;
    
    res.download(filePath, nomFichier);
    
  } catch (error) {
    console.error('Erreur téléchargement lettre d\'acceptation:', error);
    res.status(500).json({ 
      error: 'Erreur lors du téléchargement de la lettre d\'acceptation' 
    });
  }
};

const checkByDossier = async (req, res) => {
  try {
    const { idDossier } = req.params;
    
    const lettreAcceptation = await req.prisma.lettreAcceptation.findFirst({
      where: { IDDOSSIER: parseInt(idDossier) },
      select: {
        IDLETTRE: true,
        FICHIER: true,
        DATEUPLOAD: true,
        COMMENTAIRE: true,
        EMAILSENT: true
      }
    });
    
    res.json({
      exists: !!lettreAcceptation,
      lettreAcceptation: lettreAcceptation
    });
    
  } catch (error) {
    console.error('Erreur vérification lettre d\'acceptation:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification de la lettre d\'acceptation' 
    });
  }
};

const renvoyerEmail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lettreAcceptation = await req.prisma.lettreAcceptation.findUnique({
      where: { IDLETTRE: parseInt(id) },
      include: {
        dossier: {
          include: {
            etudiant: true
          }
        }
      }
    });
    
    if (!lettreAcceptation) {
      return res.status(404).json({ 
        success: false,
        error: 'Lettre d\'acceptation non trouvée' 
      });
    }
    
    const dossier = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: lettreAcceptation.IDDOSSIER }
    });
    
    if (!dossier) {
      return res.status(404).json({ 
        success: false,
        error: 'Dossier non trouvé' 
      });
    }
    
    const emailResult = await sendAcceptationEmail(
      lettreAcceptation.dossier.etudiant,
      dossier,
      lettreAcceptation.FICHIER
    );
    
    if (emailResult.success) {
      await req.prisma.lettreAcceptation.update({
        where: { IDLETTRE: parseInt(id) },
        data: { EMAILSENT: true }
      });
    }
    
    res.json({
      success: true,
      message: emailResult.success ? 'Email renvoyé avec succès' : 'Échec de l\'envoi de l\'email',
      emailResult: emailResult
    });
    
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du renvoi de l\'email' 
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteLettreAcceptation,
  getByDossier,
  downloadLettreAcceptation,
  checkByDossier,
  renvoyerEmail
};