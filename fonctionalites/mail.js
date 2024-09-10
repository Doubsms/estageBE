const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP pour l'envoi d'e-mails
const transporter = nodemailer.createTransport({
  host: 'smtp.outlook.com', // Remplacez par l'hôte SMTP approprié
  port: 587, // Remplacez par le port SMTP approprié
  secure: false, // Si vous utilisez SSL/TLS, mettez à true
  auth: {
    user: 'inscameroun@outlook.com', // Remplacez par votre nom d'utilisateur SMTP
    pass: 'Doubsms2004' // Remplacez par votre mot de passe SMTP
  }
});

// Fonction pour envoyer un e-mail
async function sendEmail(to, subject, text) {
  try {
    const mailOptions = {
      from: 'inscameroun@outlook.com', // Remplacez par votre adresse e-mail
      to: to,
      subject: subject,
      text: text,
    };

    // Envoyer l'e-mail en utilisant le transporteur SMTP configuré
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail envoyé :', info.messageId);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
  }
}

module.exports = {
  sendEmail
};