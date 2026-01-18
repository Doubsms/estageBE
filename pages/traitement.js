const nodemailer = require('nodemailer');

// Configuration email
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'inscameroun@outlook.com',
    pass: 'Doubsms2004'
  }
});

// Fonction d'envoi d'email
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: '"Institut National de la Statistique" <inscameroun@outlook.com>',
    to: to,
    subject: subject,
    text: text,
  };
  
  return await transporter.sendMail(mailOptions);
}

exports.affectation = async (req, res) => {
  try {
    const {
      decision,
      adminemail,
      selectedSupervisor,
      dossier,
      IDSTRUCTURE,
      structureName,
      supervisorName,
      adresseEmail,
      nom
    } = req.body;
    
    // Validation
    if (!decision || !dossier || !adminemail) {
      return res.status(400).json({ success: false, error: 'Champs manquants' });
    }
    
    const admin = await req.prisma.administrateur.findFirst({
      where: { EMAILADMIN: adminemail }
    });
    
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin non trouvé' });
    }
    
    const dossierNum = parseInt(dossier, 10);
    
    // 1. Mise à jour de l'état du dossier (sans toucher à EMAILSENT)
    await req.prisma.dossier.update({
      where: { IDDOSSIER: dossierNum },
      data: { ETAT: decision }
    });
    
    // 2. Si acceptation, créer l'affectation
    if (decision === 'accepté') {
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
    
    // 3. ENVOI EMAIL ET GESTION DE EMAILSENT
    let emailSent = false;
    
    if (adresseEmail && nom) {
      const subject = 'Institut National de la Statistique';
      const text = decision === 'accepté'
        ? `Cher(e) ${nom}, demande acceptée. Structure: ${structureName}, Encadreur: ${supervisorName}`
        : `Cher(e) ${nom}, demande non retenue.`;
      
      try {
        // TENTATIVE D'ENVOI
        await sendEmail(adresseEmail, subject, text);
        
        // ✅ SEULEMENT SI RÉUSSI : mettre EMAILSENT à true
        await req.prisma.dossier.update({
          where: { IDDOSSIER: dossierNum },
          data: { EMAILSENT: true }
        });
        
        emailSent = true;
        console.log('Email envoyé et EMAILSENT = true');
        
      } catch (emailError) {
        // ❌ EMAILSENT n'est PAS modifié
        console.log('Email échoué, EMAILSENT non modifié');
      }
    }
    
    // Récupérer l'état final
    const dossierFinal = await req.prisma.dossier.findUnique({
      where: { IDDOSSIER: dossierNum },
      select: { EMAILSENT: true }
    });
    
    // Réponse
    res.json({
      success: true,
      message: `Dossier ${decision}`,
      dossierId: dossierNum,
      decision,
      emailSent, // true seulement si email réussi
      dossierEmailSent: dossierFinal?.EMAILSENT || false // valeur réelle
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({ success: false, error: 'Erreur traitement' });
  }
};