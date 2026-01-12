const mail = require('../fonctionalites/mail');
const express = require('express');
const router = express.Router();

// Route pour accepter ou rejeter une demande
router.post('/decision', async (req, res) => {
    const { decision, nom, adresseEmail, NUMERODEDOSSIER } = req.body;
    const pool = req.app.get('connection'); // Récupération du pool de promesses

    console.log('Traitement de la décision:', { decision, nom, adresseEmail, NUMERODEDOSSIER });

    // 1. Validation et préparation des messages
    let subject;
    let text;
    let etat;

    if (decision === 'accepté') {
        subject = 'Institut National de la Statistique (Service des Stages)';
        text = `Cher(e) ${nom},\n\nNous avons le plaisir de vous informer que votre demande de stage à l'Institut National de la Statistique a été acceptée. Veuillez vous rapprocher de l'institut pour les modalités pratiques.`;
        etat = 'accepté';
    } else if (decision === 'rejeté') {
        subject = 'Institut National de la Statistique (Service des Stages)';
        text = `Cher(e) ${nom},\n\nNous regrettons de vous informer que votre demande n'a pas pu être retenue pour cette période. Nous vous remercions de l'intérêt porté à notre institution.`;
        etat = 'rejeté';
    } else {
        return res.status(400).json({ error: 'Décision non valide' });
    }

    try {
        // 2. Mise à jour de l'état en base de données avec await
        const query = 'UPDATE dossier SET ETAT = ? WHERE NUMERODEDOSSIER = ?';
        const [results] = await pool.query(query, [etat, NUMERODEDOSSIER]);

        if (results.affectedRows === 0) {
            console.log('Dossier non trouvé:', NUMERODEDOSSIER);
            return res.status(404).json({ error: 'Dossier non trouvé' });
        }

        console.log(`État du dossier ${NUMERODEDOSSIER} mis à jour : ${etat}`);

        // 3. Envoi de l'e-mail
        // On attend que l'envoi soit réussi avant de répondre au client
        await mail.sendEmail(adresseEmail, subject, text);
        
        console.log('E-mail envoyé avec succès à:', adresseEmail);
        res.json({ message: `Dossier ${etat} et e-mail envoyé avec succès` });

    } catch (error) {
        // Gestion centralisée des erreurs (SQL ou Mail)
        console.error('Erreur lors du traitement de la décision:', error);
        
        if (error.code === 'ECONNREFUSED' || error.command === 'CONN') {
            return res.status(500).json({ error: 'Erreur de connexion au service de mail' });
        }
        
        res.status(500).json({ error: 'Une erreur est survenue lors du traitement' });
    }
});

module.exports = router;