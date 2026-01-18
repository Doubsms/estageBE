// Récupérer la liste des demandes non traitées avec Prisma
exports.getDemandesNT = async (req, res) => {
  console.log('🔍 Récupération des demandes non traitées...');

  try {
    // Utilisation directe de req.prisma qui est déjà disponible
    const demandes = await req.prisma.dossier.findMany({
      where: {
        ETAT: 'non traité'
      },
      include: {
        etudiant: {
          select: {
            MATRICULEETUDIANT: true,
            NOMETUDIANT: true,
            PRENOMETUDIANT: true,
            ETABLISSEMENT: true,
            EMAIL: true,
            TEL: true,
            FILIERE: true,
            NIVEAU: true,
            VILLERESIDENCE: true,
            SEXE: true,
          }
        }
      },
      orderBy: {
        DATEDEPOT: 'desc' // Trie par date de dépôt la plus récente
      }
    });

    console.log(`📊 ${demandes.length} demande(s) non traitée(s) trouvée(s)`);

    // Si aucun résultat, on renvoie un tableau vide
    if (demandes.length === 0) {
      return res.json([]);
    }

    // Formater les données et ajouter les URLs des fichiers
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    const demandesFormatees = demandes.map(dossier => {
      // Formater les dates (si elles existent)
      const dateDebut = dossier.DATEDEBUTDESEANCE 
        ? new Date(dossier.DATEDEBUTDESEANCE).toLocaleDateString('fr-FR')
        : null;
      
      const dateFin = dossier.DATEFINDESEANCE 
        ? new Date(dossier.DATEFINDESEANCE).toLocaleDateString('fr-FR')
        : null;

      // Formater la date de dépôt
      const dateDepot = dossier.DATEDEPOT
        ? new Date(dossier.DATEDEPOT).toLocaleDateString('fr-FR')
        : null;

      // Récupérer les infos de l'étudiant
      const etudiant = dossier.etudiant || {};

      return {
        // Infos dossier
        IDDOSSIER: dossier.IDDOSSIER,
        NUMERODEDOSSIER: dossier.IDDOSSIER, // Utilise IDDOSSIER comme numéro de dossier
        THEME: dossier.THEME || null,
        ETAT: dossier.ETAT,
        
        // Dates
        DATEDEBUTDESEANCE: dateDebut,
        DATEFINDESEANCE: dateFin,
        DATEDEPOT: dateDepot,
        DATEDEBUTDESEANCE_RAW: dossier.DATEDEBUTDESEANCE,
        DATEFINDESEANCE_RAW: dossier.DATEFINDESEANCE,
        DATEDEPOT_RAW: dossier.DATEDEPOT,
        
        // Fichiers avec URLs complètes
        CNI: dossier.CNI ? `${baseUrl}${dossier.CNI}` : null,
        CERTIFICAT: dossier.CERTIFICAT ? `${baseUrl}${dossier.CERTIFICAT}` : null,
        LETTREMOTIVATION: dossier.LETTREMOTIVATION ? `${baseUrl}${dossier.LETTREMOTIVATION}` : null,
        LETTRERECOMMENDATION: dossier.LETTRERECOMMENDATION ? `${baseUrl}${dossier.LETTRERECOMMENDATION}` : null,
        PHOTOPROFIL: dossier.PHOTOPROFIL ? `${baseUrl}${dossier.PHOTOPROFIL}` : null,
        
        // Infos étudiant
        MATRICULEETUDIANT: etudiant.MATRICULEETUDIANT || dossier.MATRICULEETUDIANT,
        NOMETUDIANT: etudiant.NOMETUDIANT || 'Non renseigné',
        PRENOMETUDIANT: etudiant.PRENOMETUDIANT || 'Non renseigné',
        ETABLISSEMENT: etudiant.ETABLISSEMENT || 'Non renseigné',
        EMAIL: etudiant.EMAIL || 'Non renseigné',
        TEL: etudiant.TEL || 'Non renseigné',
        FILIERE: etudiant.FILIERE || 'Non renseigné',
        NIVEAU: etudiant.NIVEAU || 'Non renseigné',
        VILLERESIDENCE: etudiant.VILLERESIDENCE || 'Non renseigné',
        SEXE: etudiant.SEXE || 'Non renseigné'
      };
    });

    // Log pour débogage
    console.log('✅ Demandes formatées:', demandesFormatees.length);
    
    res.json(demandesFormatees);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des demandes non traitées :', error);
    
    // Erreur plus détaillée selon le type
    if (error.code === 'P2021') {
      // Table ou colonne inexistante
      console.error('⚠️  Erreur Prisma: Table ou colonne inexistante');
      res.status(500).json({ 
        error: 'Erreur de configuration de la base de données',
        details: 'Vérifiez que la table "dossier" et ses relations existent'
      });
    } else if (error.code === 'P1001') {
      // Connexion impossible
      console.error('⚠️  Erreur Prisma: Connexion à la BD impossible');
      res.status(500).json({ 
        error: 'Connexion à la base de données impossible' 
      });
    } else {
      // Erreur générale
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des demandes non traitées',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};