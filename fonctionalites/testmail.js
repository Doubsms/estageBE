const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

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

exports.sendEMail = async (req, res) => {
  try {
    const { 
      etudiantEmail, 
      etudiantNom, 
      etudiantPrenom
    } = req.body;
    
    // Validation des champs requis
    if (!etudiantEmail) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "etudiantEmail" est requis'
      });
    }

    // Chemin vers votre logo
    const logoPath = path.join(__dirname, 'logo_INS_cameroun.png');
    
    // Lire le fichier logo s'il existe
    let attachments = [];
    let logoContentId = 'logo@inscameroun';
    
    if (fs.existsSync(logoPath)) {
      const logoContent = fs.readFileSync(logoPath);
      attachments = [{
        filename: 'logo_INS_cameroun.png',
        content: logoContent,
        contentType: 'image/png',
        cid: logoContentId
      }];
      console.log('✅ Logo trouvé et chargé');
    } else {
      console.log('⚠️ Logo non trouvé à l\'emplacement:', logoPath);
    }

    // HTML simplifié avec juste le logo et un petit texte de test
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email Logo</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; text-align: center;">
          <!-- Logo -->
          <img src="cid:${logoContentId}" 
               alt="INS Cameroun" 
               style="display: block; margin: 0 auto 30px auto; max-width: 200px; height: auto;">
          
          <!-- Texte de test -->
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-bottom: 15px;">✅ Test d'envoi d'email</h1>
            <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
              Ceci est un email de test pour vérifier l'affichage du logo INS Cameroun.
            </p>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
              <p style="margin: 5px 0;"><strong>Destinataire :</strong> ${etudiantPrenom || 'Utilisateur'} ${etudiantNom || ''}</p>
              <p style="margin: 5px 0;"><strong>Email :</strong> ${etudiantEmail}</p>
              <p style="margin: 5px 0;"><strong>Date d'envoi :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <p style="margin-top: 25px; color: #7f8c8d; font-size: 14px;">
              Si vous voyez le logo ci-dessus, l'intégration du logo dans les emails fonctionne correctement !
            </p>
          </div>
          
          <!-- Signature -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #2c3e50; font-weight: bold; margin-bottom: 5px;">
              Institut National de la Statistique du Cameroun
            </p>
            <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
              Service des Stages
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Version texte simple
    const plainText = `
TEST EMAIL - LOGO INS CAMEROUN

Ceci est un email de test pour vérifier l'affichage du logo INS Cameroun.

Destinataire: ${etudiantPrenom || 'Utilisateur'} ${etudiantNom || ''}
Email: ${etudiantEmail}
Date: ${new Date().toLocaleDateString('fr-FR')}

Institut National de la Statistique du Cameroun
Service des Stages
    `;

    const mailOptions = {
      from: '"Service des Stages - INS Cameroun" <inscamerounstage@gmail.com>',
      to: etudiantEmail,
      subject: `[TEST] Email avec logo - INS Cameroun`,
      text: plainText,
      html: htmlContent,
      attachments: attachments,
      replyTo: 'inscamerounstage@gmail.com',
      // Ajout des en-têtes pour une meilleure compatibilité
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'Nodemailer',
        'MIME-Version': '1.0'
      }
    };

    console.log(`📨 Envoi d'email test à: ${etudiantEmail}`);
    console.log(`📎 Logo inclus: ${attachments.length > 0 ? 'Oui' : 'Non'}`);

    // Assurez-vous que le transporteur est défini
    if (!transporter) {
      throw new Error('Le transporteur nodemailer n\'est pas défini');
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de test envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    console.log('📤 Réponse:', info.response || 'Pas de réponse du serveur');
    
    res.status(200).json({
      success: true,
      message: 'Email de test envoyé avec succès',
      data: {
        messageId: info.messageId,
        etudiant: `${etudiantPrenom || ''} ${etudiantNom || ''}`.trim(),
        email: etudiantEmail,
        logoIncluded: attachments.length > 0,
        logoPath: attachments.length > 0 ? logoPath : 'Non trouvé',
        timestamp: new Date().toISOString(),
        accepted: info.accepted,
        rejected: info.rejected
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de test:', error.message);
    console.error('🔧 Code d\'erreur:', error.code || 'N/A');
    console.error('🔍 Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email de test',
      details: {
        message: error.message,
        code: error.code || 'N/A',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};