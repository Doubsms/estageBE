const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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

// Fonction pour envoyer l'email de rejet de stage
async function sendRejetEmail(etudiant, dossier, motifRejet) {
  try {
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
          <div style="background: linear-gradient(180deg, #f8d7da 0%, #f5c6cb 100%); padding: 5px; text-align: center;">
            ${logoAttachments.length > 0 ? `
              <img src="cid:${logoContentId}" 
                   alt="INS Cameroun" 
                   style="display: block; margin: 0 auto 20px auto; max-width: 240px; height: auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
            ` : ''}
            <div style="margin-top: 20px;">
              <h1 style="color: #721c24; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">ℹ️ STATUT DE VOTRE DEMANDE</h1>
              <p style="color: #721c24; font-size: 18px; margin-top: 10px; font-weight: 300;">
                Mise à jour concernant votre demande de stage
              </p>
            </div>
          </div>
          
          <!-- Contenu principal -->
          <div style="padding: 5px;">
            <!-- Salutation -->
            <p style="font-size: 18px; line-height: 1.6; color: #2c3e50; margin-bottom: 25px;">
              Cher(e) <strong style="color: #721c24;">${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT}</strong>,
            </p>
            
            <!-- Message principal -->
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #dc3545;">
              <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
                Nous avons le regret de vous informer que votre demande de stage
                à l'Institut National de la Statistique du Cameroun <strong style="color: #dc3545;">n'a pas pu être acceptée</strong>.
              </p>
            </div>
            
            <!-- Motif du rejet -->
            <div style="background-color: #fff3cd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 20px; display: flex; align-items: center;">
                <span style="background-color: #ffc107; color: #856404; padding: 8px 12px; border-radius: 50%; margin-right: 10px;">📌</span>
                Motif du rejet
              </h3>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #ffeeba;">
                <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #856404; font-style: italic;">
                  "${motifRejet}"
                </p>
              </div>
            </div>
            
            <!-- Informations complémentaires -->
            <div style="margin: 35px 0; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px;">
              <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                <span style="background-color: #6c757d; color: white; padding: 8px 12px; border-radius: 50%; margin-right: 10px;">💡</span>
                Recommandations
              </h3>
              
              <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 16px; line-height: 1.8;">
                <li>Vérifiez que tous les documents demandés sont fournis et complets</li>
                <li>Assurez-vous que votre dossier répond aux critères d'éligibilité</li>
                <li>Vous pouvez soumettre une nouvelle demande ultérieurement</li>
                <li>Pour toute question, contactez le service des stages</li>
              </ul>
            </div>
            
            <!-- Message de soutien -->
            <div style="text-align: center; padding: 5px; background: linear-gradient(135deg, #f1f3f5 0%, #dee2e6 100%); border-radius: 10px; margin: 30px 0; border: 1px solid #adb5bd;">
              <p style="margin: 0; font-size: 18px; color: #495057; font-weight: 500;">
                Nous vous encourageons à postuler à nouveau et vous souhaitons plein de succès dans vos démarches.
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
MISE À JOUR CONCERNANT VOTRE DEMANDE DE STAGE
Institut National de la Statistique du Cameroun
========================================================

Cher(e) ${etudiant.PRENOMETUDIANT} ${etudiant.NOMETUDIANT},

Nous avons le regret de vous informer que votre demande de stage professionnel à l'Institut National de la Statistique du Cameroun n'a pas pu être acceptée.

📌 MOTIF DU REJET :
"${motifRejet}"

💡 RECOMMANDATIONS :
- Vérifiez que tous les documents demandés sont fournis et complets
- Assurez-vous que votre dossier répond aux critères d'éligibilité
- Vous pouvez soumettre une nouvelle demande ultérieurement
- Pour toute question, contactez le service des stages

Nous vous encourageons à postuler à nouveau et vous souhaitons plein de succès dans vos démarches.

Cordialement,
Le Service des Stages et Développement des Compétences
Institut National de la Statistique du Cameroun

📍 Yaoundé, Cameroun
📧 inscamerounstage@gmail.com
📅 Date d'envoi : ${dateFormatted}

⚠️ Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
    `;

    // Préparer les pièces jointes (logo uniquement)
    const allAttachments = [...logoAttachments];

    const mailOptions = {
      from: '"Service des Stages - INS Cameroun" <inscamerounstage@gmail.com>',
      to: etudiant.EMAIL,
      subject: `ℹ️ [INS Cameroun] Mise à jour demande de stage - ${etudiant.MATRICULEETUDIANT}`,
      text: plainText,
      html: htmlContent,
      attachments: allAttachments,
      replyTo: 'inscamerounstage@gmail.com',
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'Nodemailer',
        'MIME-Version': '1.0',
        'Importance': 'Normal'
      }
    };

    console.log(`📨 Envoi email de rejet à: ${etudiant.EMAIL}`);
    console.log(`🎨 Logo inclus: ${logoAttachments.length > 0 ? 'Oui' : 'Non'}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de rejet envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      email: etudiant.EMAIL,
      logoIncluded: logoAttachments.length > 0
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi email de rejet:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

exports.affectation = async (req, res) => {
  try {
    const {
      decision,
      adminemail,
      selectedSupervisor,
      dossier,
      IDSTRUCTURE,
      motifRejet,
      nom
    } = req.body;
    
    // Validation
    if (!decision || !dossier || !adminemail) {
      return res.status(400).json({ success: false, error: 'Champs manquants' });
    }

    // Validation spécifique pour le rejet
    if (decision === 'rejeté' && !motifRejet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le motif de rejet est obligatoire' 
      });
    }

    if (decision === 'rejeté' && motifRejet.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le motif de rejet doit contenir au moins 10 caractères' 
      });
    }
    
    const admin = await req.prisma.administrateur.findFirst({
      where: { EMAILADMIN: adminemail }
    });
    
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin non trouvé' });
    }
    
    const dossierNum = parseInt(dossier, 10);
    
    // Récupérer les informations du dossier et de l'étudiant
    const dossierInfo = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: dossierNum },
      include: {
        etudiant: true
      }
    });

    if (!dossierInfo) {
      return res.status(404).json({ success: false, error: 'Dossier non trouvé' });
    }

    let emailSent = false;
    let emailError = null;

    // 1. Mise à jour de l'état du dossier
    await req.prisma.dossier.update({
      where: { IDDOSSIER: dossierNum },
      data: { ETAT: decision }
    });
    
    // 2. Si acceptation, créer l'affectation
    if (decision === 'accepté') {
      if (!selectedSupervisor || !IDSTRUCTURE) {
        return res.status(400).json({ 
          success: false, 
          error: 'Encadreur et structure obligatoires pour l\'acceptation' 
        });
      }

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
    // 3. Si rejet, envoyer l'email de rejet
    else if (decision === 'rejeté') {
      try {
        const emailResult = await sendRejetEmail(dossierInfo.etudiant, dossierInfo, motifRejet);
        emailSent = emailResult.success;
        
        if (!emailResult.success) {
          emailError = emailResult.error;
        }

               // Optionnel : enregistrer le motif de rejet dans une table dédiée si elle existe
        // await req.prisma.rejetMotif.create({
        //   data: {
        //     IDDOSSIER: dossierNum,
        //     MOTIF: motifRejet,
        //     DATE_REJET: new Date()
        //   }
        // });

      } catch (emailError) {
        console.error('Erreur envoi email de rejet:', emailError);
        emailSent = false;
        emailError = emailError.message;
      }
    }
    
    // Réponse
    res.json({
      success: true,
      message: `Dossier ${decision}`,
      dossierId: dossierNum,
      decision,
      emailSent,
      ...(emailError && { emailError, warning: `L'email de ${decision} n'a pas pu être envoyé` }),
      motifRejet: decision === 'rejeté' ? motifRejet : undefined
    });
    
  } catch (error) {
    console.error('Erreur dans affectation:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du traitement',
      details: error.message 
    });
  }
};