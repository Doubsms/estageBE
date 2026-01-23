// emailService.js
const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP pour Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Hôte SMTP de Gmail
  port: 587,
  secure: false, // false pour le port 587, true pour 465
  requireTLS: true, // Requiert TLS
  auth: {
    user: 'inscamerounstage@gmail.com', // Votre adresse Gmail
    pass: 'cdtfhjfuzxjirues' // Mot de passe d'application Gmail
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
    
    // Validation des données requises
    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: 'Les champs "to", "subject" et "text" sont requis'
      });
    }

    // Préparation des options de l'email
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

    // Envoi de l'email
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
