const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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

/**
 * Envoi d'un email générique avec logo optionnel
 */
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html, attachments, cc, bcc, includeLogo } = req.body;
    
    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: 'Les champs "to", "subject" et "text" sont requis'
      });
    }

    // Préparer les pièces jointes
    let finalAttachments = attachments || [];
    
    // Ajouter le logo si demandé
    if (includeLogo) {
      const logoData = loadLogo();
      if (logoData.attachments.length > 0) {
        finalAttachments = [...finalAttachments, ...logoData.attachments];
        
        // Si du HTML est fourni, ajouter le logo automatiquement
        if (html) {
          // Vérifier si le logo n'est pas déjà dans le HTML
          if (!html.includes('cid:logo@inscameroun') && !html.includes('logo_INS_cameroun.png')) {
            // Optionnel : on pourrait modifier le HTML pour y ajouter le logo
            console.log('ℹ️ Logo ajouté en pièce jointe, pensez à l\'inclure dans votre HTML avec src="cid:logo@inscameroun"');
          }
        }
      }
    }

    // Générer le HTML avec logo si aucun HTML n'est fourni
    let finalHtml = html;
    if (!html && includeLogo) {
      const logoData = loadLogo();
      if (logoData.attachments.length > 0) {
        finalHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <img src="cid:${logoData.logoContentId}" alt="INS Cameroun" style="display: block; margin: 0 auto 20px auto; max-width: 150px;">
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2c3e50;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">${text.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #7f8c8d; font-size: 14px;">Institut National de la Statistique du Cameroun</p>
            </div>
          </div>
        `;
      } else {
        finalHtml = `<p>${text}</p>`;
      }
    } else if (!html) {
      finalHtml = `<p>${text}</p>`;
    }

    const mailOptions = {
      from: '"INS Cameroun" <inscamerounstage@gmail.com>',
      to: to,
      subject: subject,
      text: text,
      html: finalHtml,
      attachments: finalAttachments,
      cc: cc,
      bcc: bcc,
      replyTo: 'inscamerounstage@gmail.com',
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'Nodemailer',
        'MIME-Version': '1.0'
      }
    };

    console.log(`📨 Tentative d'envoi d'email à: ${to}`);
    console.log(`📎 Nombre de pièces jointes: ${finalAttachments.length}`);
    if (includeLogo) {
      console.log(`🎨 Logo inclus: ${finalAttachments.some(a => a.filename === 'logo_INS_cameroun.png') ? 'Oui' : 'Non'}`);
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    console.log('📤 Réponse du serveur:', info.response);
    
    res.status(200).json({
      success: true,
      message: 'Email envoyé avec succès',
      data: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        logoIncluded: finalAttachments.some(a => a.filename === 'logo_INS_cameroun.png'),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    console.error('🔧 Code d\'erreur:', error.code);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
      details: {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
};

/**
 * Envoi d'accusé de réception pour un dossier de stage avec logo intégré
 */
exports.sendAccuseReceptionDossier = async (req, res) => {
  try {
    const { 
      etudiantEmail, 
      etudiantNom, 
      etudiantPrenom,
      dateDebut,
      dateFin
    } = req.body;
    
    if (!etudiantEmail || !etudiantNom || !etudiantPrenom) {
      return res.status(400).json({
        success: false,
        error: 'Les champs "etudiantEmail", "etudiantNom" et "etudiantPrenom" sont requis'
      });
    }

    const dateFormatted = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const periodeStage = dateDebut && dateFin 
      ? `Du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}`
      : 'À définir';

    // Charger le logo
    const { attachments, logoContentId } = loadLogo();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <!-- Logo INS Cameroun -->
        ${attachments.length > 0 ? `<img src="cid:${logoContentId}" alt="INS Cameroun" style="display: block; margin: 0 auto 25px auto; max-width: 180px; height: auto;">` : ''}
        
        <h2 style="color: #2c3e50; text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0;">
          Accusé de Réception - Dossier de Stage
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
          Cher(e) <strong>${etudiantPrenom} ${etudiantNom}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">
          Nous accusons bonne réception de votre dossier de stage reçu le <br>
          <strong style="color: #2c3e50;">${dateFormatted}</strong>.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 25px 0;">
          <p style="color: #2c3e50; font-weight: bold; margin-top: 0; margin-bottom: 15px; font-size: 17px;">
            📋 Informations sur le stage :
          </p>
          <p style="margin: 10px 0; font-size: 16px;">
            <strong style="color: #555;">👤 Étudiant :</strong> ${etudiantPrenom} ${etudiantNom}
          </p>
          <p style="margin: 10px 0; font-size: 16px;">
            <strong style="color: #555;">📅 Période de stage :</strong> ${periodeStage}
          </p>
          <p style="margin: 10px 0; font-size: 16px;">
            <strong style="color: #555;">📧 Email :</strong> ${etudiantEmail}
          </p>
        </div>
        
        <div style="background-color: #e8f6f3; padding: 15px; border-radius: 6px; margin: 25px 0; border: 1px dashed #1abc9c;">
          <p style="text-align: center; margin: 0; font-size: 16px; color: #16a085;">
            <strong>⏳ Votre dossier est en cours de traitement.</strong><br>
            Vous serez informé(e) de la suite de la procédure dans les plus brefs délais.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #2c3e50; font-weight: bold; margin-bottom: 5px;">
            Institut National de la Statistique du Cameroun
          </p>
          <p style="color: #7f8c8d; font-size: 15px; margin: 5px 0;">
            Service des Stages
          </p>
          <p style="color: #95a5a6; font-size: 14px; margin: 5px 0;">
            Email : <a href="mailto:inscamerounstage@gmail.com" style="color: #3498db;">inscamerounstage@gmail.com</a>
          </p>
          <p style="color: #bdc3c7; font-size: 13px; margin-top: 15px;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </div>
      </div>
    `;

    const plainText = `
ACCUSE DE RECEPTION - DOSSIER DE STAGE
Institut National de la Statistique du Cameroun

Cher(e) ${etudiantPrenom} ${etudiantNom},

Nous accusons bonne réception de votre dossier de stage reçu le ${dateFormatted}.

INFORMATIONS :
- Étudiant : ${etudiantPrenom} ${etudiantNom}
- Période de stage : ${periodeStage}
- Email : ${etudiantEmail}

Votre dossier est en cours de traitement. Vous serez informé(e) de la suite de la procédure dans les plus brefs délais.

Cordialement,
Service des Stages
Institut National de la Statistique du Cameroun
Email : inscamerounstage@gmail.com
    `;

    const mailOptions = {
      from: '"Service des Stages - INS Cameroun" <inscamerounstage@gmail.com>',
      to: etudiantEmail,
      subject: `[INS Cameroun] Accusé de réception - Dossier de stage de ${etudiantPrenom} ${etudiantNom}`,
      text: plainText,
      html: htmlContent,
      attachments: attachments,
      replyTo: 'inscamerounstage@gmail.com',
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'Nodemailer',
        'MIME-Version': '1.0',
        'Importance': 'Normal'
      }
    };

    console.log(`📨 Envoi d'accusé réception à: ${etudiantEmail}`);
    console.log(`👤 Étudiant: ${etudiantPrenom} ${etudiantNom}`);
    console.log(`🎨 Logo inclus: ${attachments.length > 0 ? 'Oui' : 'Non'}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Accusé de réception envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    console.log('📤 Réponse:', info.response || 'Pas de réponse du serveur');
    
    res.status(200).json({
      success: true,
      message: 'Accusé de réception envoyé avec succès',
      data: {
        messageId: info.messageId,
        etudiant: `${etudiantPrenom} ${etudiantNom}`,
        email: etudiantEmail,
        logoIncluded: attachments.length > 0,
        periodeStage: periodeStage,
        timestamp: new Date().toISOString(),
        accepted: info.accepted,
        rejected: info.rejected
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'accusé de réception:', error.message);
    console.error('🔧 Code d\'erreur:', error.code || 'N/A');
    console.error('🔍 Détails:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'accusé de réception',
      details: {
        message: error.message,
        code: error.code || 'N/A',
        command: error.command || 'N/A'
      }
    });
  }
};