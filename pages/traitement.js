const mail = require('../fonctionalites/mail');
const express = require('express');
const router = express.Router();

// Route pour accepter ou rejeter une demande
router.post('/decision', async (req, res) => {
  const { decision, nom, adresseEmail, NUMERODEDOSSIER } = req.body;

  console.log('Données reçues:', { decision, nom, adresseEmail, NUMERODEDOSSIER });

  // Déterminer le sujet et le texte du mail en fonction de la décision
  let subject;
  let text;
  let etat;

  if (decision === 'accepté') {
    subject = 'Institut National de la Statistique (service de stage)';
    text = `Cher(e) ${nom},\n\nNous avons le plaisir de vous informer que votre demande de stage à l'institut Nationale de la Statistique a été acceptée. Veuillez vous rapprocher de l'institut pour plus d'information.`;
    etat = 'accepté';
  } else if (decision === 'rejeté') {
    subject = 'Institut Nationale de la Statistique (service de stage)';
    text = `Cher(e) ${nom},\n\nNous regrettons de vous informer que votre demande a été rejetée. Veuillez nous contacter pour plus d'informations.`;
    etat = 'rejeté';
  } else {
    return res.status(400).json({ error: 'Décision non valide' });
  }

  // Mise à jour de l'état du dossier dans la base de données
  const query = 'UPDATE dossier SET ETAT = ? WHERE NUMERODEDOSSIER = ?';
  const connection = req.app.get('connection'); // Assurez-vous que la connexion est définie dans app.js

  connection.query(query, [etat, NUMERODEDOSSIER], async (error, results) => {
    if (error) {
      console.error('Erreur lors de la mise à jour du dossier :', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du dossier' });
    }
    else
    console.log('Etat mis à jour avec succès')
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    try {
      // Envoyer l'e-mail
      await mail.sendEmail(adresseEmail, subject, text);
      res.json({ message: 'e-mail envoyé avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'e-mail' });
    }
  });
});

module.exports = router;
