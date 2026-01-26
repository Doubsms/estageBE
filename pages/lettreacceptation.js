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

// Configuration du transporteur SMTP pour Gmail
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

// Fonction pour charger le logo
const loadLogo = () => {
  const logoPath = path.join(__dirname, 'logo_INS_cameroun.png');
  let attachments = [];
  let logoContentId = 'logo@inscameroun';
  
  if (fs.existsSync(logoPath)) {
    try {
      const logoContent = fs.readFileSync(logoPath);
      attachments = [{
        filename: 'logo_INS_cameroun.png',
        content: logoContent,
        contentType: 'image/png',
        cid: logoContentId
      }];
      console.log('✅ Logo chargé avec succès');
      return { attachments, logoContentId };
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du logo:', error.message);
    }
  } else {
    console.warn('⚠️ Logo non trouvé à l\'emplacement:', logoPath);
  }
  
  return { attachments: [], logoContentId };
};

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

    // Charger le logo
    const { attachments: logoAttachments, logoContentId } = loadLogo();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa00;">
        <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <!-- En-tête avec logo -->
          <div style="background: linear-gradient(180deg, #cae0ce 0%, #f5fbf8 100%); padding: 5px; text-align: center;">
            ${logoAttachments.length > 0 ? `
              <img src="cid:${logoContentId}" 
                   alt="INS Cameroun" 
                   style="display: block; margin: 0 auto 20px auto; max-width: 240px; height: auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
            ` : ''}
            <div style="margin-top: 20px;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">🎉 FÉLICITATIONS !</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin-top: 10px; font-weight: 300;">
                Votre demande de stage a été acceptée
              </p>
            </div>
          </div>
          
          <!-- Contenu principal -->
          <div style="padding: 5px;">
            <!-- Salutation -->
            <p style="font-size: 18px; line-height: 1.6; color: #2c3e50; margin-bottom: 25px;">
              Cher(e) <strong style="color: #3c3ce7;">${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT}</strong>,
            </p>
            
            <!-- Message principal -->
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #27ae60;">
              <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
                Nous avons le plaisir de vous informer que votre demande de stage professionnel 
                <strong style="color: #27ae60;">a été officiellement approuvée</strong> par l'Institut National de la Statistique du Cameroun.
              </p>
            </div>
            
            <!-- Détails du stage -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border: 2px solid #dfe6e9;">
              <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                <span style="background-color: #3498db; color: white; padding: 8px 12px; border-radius: 50%; margin-right: 10px;">📋</span>
                Détails de votre stage
              </h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  <p style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 14px;">👤 Étudiant</p>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT}</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  <p style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 14px;">🔢 Matricule</p>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">${etudiant.MATRICULEETUDIANT}</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  <p style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 14px;">📅 Période</p>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">${periodeStage}</p>
                </div>
                
                ${dossier.THEME ? `
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  <p style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 14px;">🎯 Thème</p>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">${dossier.THEME}</p>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Pièce jointe -->
            <div style="background-color: #e3f2fd; padding: 5px; border-radius: 10px; margin: 25px 0; border: 2px dashed #2196f3;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="background-color: #2196f3; color: white; padding: 10px; border-radius: 50%; margin-right: 15px; font-size: 18px;">📎</span>
                <div>
                  <p style="margin: 0 0 5px 0; font-weight: bold; color: #1565c0; font-size: 17px;">
                    Lettre d'acceptation officielle
                  </p>
                  <p style="margin: 0; color: #333; font-size: 15px;">
                    Votre document officiel est joint à cet email au format PDF.
                  </p>
                </div>
              </div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; font-style: italic;">
                ⚠️ Conservez précieusement ce document, il vous sera demandé lors de votre stage.
              </p>
            </div>
            
            <!-- Prochaines étapes -->
            <div style="margin: 35px 0;">
              <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                <span style="background-color: #9b59b6; color: white; padding: 8px 12px; border-radius: 50%; margin-right: 10px;">🚀</span>
                Prochaines étapes à suivre
              </h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-top: 4px solid #3498db;">
                  <div style="font-size: 24px; color: #3498db; margin-bottom: 10px;">1</div>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">Téléchargez votre lettre</p>
                  <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 14px;">Ouvrez et imprimez le PDF joint</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-top: 4px solid #2ecc71;">
                  <div style="font-size: 24px; color: #2ecc71; margin-bottom: 10px;">2</div>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">Contactez votre encadreur</p>
                  <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 14px;">Prenez contact pour planifier</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-top: 4px solid #e74c3c;">
                  <div style="font-size: 24px; color: #e74c3c; margin-bottom: 10px;">3</div>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">Préparez la convention</p>
                  <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 14px;">Remplissez les documents requis</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-top: 4px solid #f39c12;">
                  <div style="font-size: 24px; color: #f39c12; margin-bottom: 10px;">4</div>
                  <p style="margin: 0; font-weight: 600; color: #2c3e50;">Démarrez votre stage</p>
                  <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 14px;">Selon la période convenue</p>
                </div>
              </div>
            </div>
            
            <!-- Message de félicitations -->
            <div style="text-align: center; padding: 5px; background: linear-gradient(135deg, #fff9e6 0%, #ffeaa7 100%); border-radius: 10px; margin: 30px 0; border: 1px solid #fdcb6e;">
              <p style="margin: 0; font-size: 18px; color: #d35400; font-weight: 600;">
                🏆 Toute l'équipe de l'INS Cameroun vous souhaite un stage exceptionnel, 
                riche en apprentissages et en expériences professionnelles !
              </p>
            </div>
          </div>
          
          <!-- Pied de page -->
          <div style="background-color: #2c3e50; padding: 30px; text-align: center; color: white;">
            <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
              Institut National de la Statistique du Cameroun
            </p>
            <p style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.9;">
              Service des Stages et Développement des Compétences
            </p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
              <p style="margin: 5px 0; font-size: 14px;">
                📍 Yaoundé, Cameroun
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                📧 <a href="mailto:inscamerounstage@gmail.com" style="color: #3498db; text-decoration: none;">inscamerounstage@gmail.com</a>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                📅 Date d'envoi : ${dateFormatted}
              </p>
            </div>
            
            <p style="margin-top: 25px; font-size: 12px; opacity: 0.7;">
              Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainText = `
FÉLICITATIONS ! VOTRE DEMANDE DE STAGE A ÉTÉ ACCEPTÉE
Institut National de la Statistique du Cameroun
========================================================

Cher(e) ${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT},

Nous avons le plaisir de vous informer que votre demande de stage professionnel a été officiellement approuvée par l'Institut National de la Statistique du Cameroun.

📋 DÉTAILS DE VOTRE STAGE :
- Étudiant : ${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT}
- Matricule : ${etudiant.MATRICULEETUDIANT}
- Période : ${periodeStage}
- Date d'approbation : ${dateFormatted}
${dossier.THEME ? `- Thème : ${dossier.THEME}\n` : ''}

📎 PIÈCE JOINTE :
Votre lettre d'acceptation officielle est jointe à cet email au format PDF.
Conservez précieusement ce document, il vous sera demandé lors de votre stage.

🚀 PROCHAINES ÉTAPES À SUIVRE :
1. Téléchargez votre lettre d'acceptation
2. Contactez votre encadreur pédagogique
3. Préparez votre convention de stage
4. Démarrez votre stage selon la période convenue

🏆 Toute l'équipe de l'INS Cameroun vous souhaite un stage exceptionnel, riche en apprentissages et en expériences professionnelles !

Cordialement,
Le Service des Stages et Développement des Compétences
Institut National de la Statistique du Cameroun

📍 Yaoundé, Cameroun
📧 inscamerounstage@gmail.com
📅 Date d'envoi : ${dateFormatted}

⚠️ Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
    `;

    // Préparer les pièces jointes (lettre + logo)
    const allAttachments = [
      {
        filename: `Lettre_Acceptation_${etudiant.MATRICULEETUDIANT}${path.extname(fichierLettre)}`,
        path: filePath,
        contentType: filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
      },
      ...logoAttachments // Ajouter le logo comme pièce jointe intégrée
    ];

    const mailOptions = {
      from: '"Service des Stages - INS Cameroun" <inscamerounstage@gmail.com>',
      to: etudiant.EMAIL,
      subject: `🎉 [INS Cameroun] Acceptation de stage - ${etudiant.MATRICULEETUDIANT}`,
      text: plainText,
      html: htmlContent,
      attachments: allAttachments,
      replyTo: 'inscamerounstage@gmail.com',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'X-Mailer': 'Nodemailer',
        'MIME-Version': '1.0',
        'Importance': 'High'
      }
    };

    console.log(`📨 Envoi email d'acceptation à: ${etudiant.EMAIL}`);
    console.log(`🎨 Logo inclus: ${logoAttachments.length > 0 ? 'Oui' : 'Non'}`);
    console.log(`📎 Fichier joint: ${path.basename(filePath)}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email d\'acceptation envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    console.log('📤 Réponse:', info.response || 'Pas de réponse du serveur');
    
    return {
      success: true,
      messageId: info.messageId,
      email: etudiant.EMAIL,
      logoIncluded: logoAttachments.length > 0
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi email d\'acceptation:', error.message);
    console.error('🔧 Code d\'erreur:', error.code || 'N/A');
    console.error('🔍 Stack:', error.stack);
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
        emailInfo: emailResult,
        logoIncluded: emailResult?.logoIncluded || false
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
      emailResult: emailResult,
      logoIncluded: emailResult.logoIncluded || false
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