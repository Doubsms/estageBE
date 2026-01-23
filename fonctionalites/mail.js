// emailService.js
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

/**
 * Envoi d'un email
 */
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html, attachments, cc, bcc } = req.body;
    
    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: 'Les champs "to", "subject" et "text" sont requis'
      });
    }

    const mailOptions = {
      from: '"INS Cameroun" <inscamerounstage@gmail.com>',
      to: to,
      subject: subject,
      text: text,
      html: html || `<p>${text}</p>`,
      attachments: attachments || [],
      cc: cc,
      bcc: bcc,
      replyTo: 'inscamerounstage@gmail.com'
    };

    console.log(`📨 Tentative d'envoi d'email à: ${to}`);

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
 * Envoi d'accusé de réception pour un dossier de stage
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">Accusé de Réception - Dossier de Stage</h2>
        <p>Cher(e) ${etudiantPrenom} ${etudiantNom},</p>
        <p>Nous accusons bonne réception de votre dossier de stage reçu le <strong>${dateFormatted}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Informations :</strong></p>
          <p><strong>Période de stage :</strong> ${periodeStage}</p>
        </div>
        <p>Votre dossier sera traité dans les plus brefs délais.</p>
        <p>Cordialement,<br>Service des Stages - INS Cameroun</p>
      </div>
    `;

    const plainText = `
ACCUSE DE RECEPTION - DOSSIER DE STAGE
Institut National du Sport

Cher(e) ${etudiantPrenom} ${etudiantNom},

Nous accusons bonne réception de votre dossier de stage reçu le ${dateFormatted}.

PERIODE DE STAGE : ${periodeStage}

Votre dossier sera traité dans les plus brefs délais.

Cordialement,
Service des Stages
Institut National du Sport du Cameroun
    `;

    const mailOptions = {
      from: '"Service des Stages - INS Cameroun" <inscamerounstage@gmail.com>',
      to: etudiantEmail,
      subject: `[INS Cameroun] Accusé de réception - Dossier de stage`,
      text: plainText,
      html: htmlContent,
      replyTo: 'inscamerounstage@gmail.com'
    };

    console.log(`📨 Envoi d'accusé réception à: ${etudiantEmail}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Accusé de réception envoyé avec succès');
    console.log('📧 Message ID:', info.messageId);
    
    res.status(200).json({
      success: true,
      message: 'Accusé de réception envoyé avec succès',
      data: {
        messageId: info.messageId,
        etudiant: `${etudiantPrenom} ${etudiantNom}`,
        email: etudiantEmail,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'accusé de réception:', error.message);
    console.error('🔧 Code d\'erreur:', error.code);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'accusé de réception',
      details: {
        message: error.message,
        code: error.code
      }
    });
  }
};