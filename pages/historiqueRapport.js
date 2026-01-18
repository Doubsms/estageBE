// --- 1. RÉCUPÉRER L'HISTORIQUE GLOBAL DES RAPPORTS ---
exports.getHistorique = async (req, res) => {
  try {
    const rapports = await req.prisma.rapport.findMany({
      select: {
        IDDOSSIER: true,
        MATRICULE: true,
        COMMENTAIRE: true,
        THEME: true,
        FICHIER: true,
        DATE: true,
        etudiant: {
          select: {
            NOMETUDIANT: true,
            PRENOMETUDIANT: true,
            ETABLISSEMENT: true,
            FILIERE: true,
            NIVEAU: true
          }
        }
      },
      orderBy: {
        DATE: 'desc'
      }
    });

    if (rapports.length === 0) {
      return res.json([]);
    }

    // Construire l'URL de base pour les fichiers
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    // Pour chaque rapport, chercher le dossier correspondant
    const rapportsAvecFichier = await Promise.all(
      rapports.map(async (rapport) => {
        // Chercher le dossier de l'étudiant
        let dossierInfo = null;
        try {
          dossierInfo = await req.prisma.dossier.findFirst({
            where: {
              MATRICULEETUDIANT: rapport.MATRICULE
            },
            select: {
              ETAT: true,
              DATEDEPOT: true,
              THEME: true
            }
          });
        } catch (error) {
          console.log(`Dossier non trouvé pour ${rapport.MATRICULE}`);
        }

        return {
          IDDOSSIER: rapport.IDDOSSIER,
          MATRICULE: rapport.MATRICULE,
          COMMENTAIRE: rapport.COMMENTAIRE,
          THEME: rapport.THEME,
          FICHIER: rapport.FICHIER ? `${baseUrl}/uploads/rapports/${rapport.FICHIER}` : null,
          DATE: rapport.DATE,
          // Formater la date pour l'affichage
          DATE_FORMATTEE: new Date(rapport.DATE).toLocaleDateString('fr-FR'),
          // Informations de l'étudiant
          NOMETUDIANT: rapport.etudiant?.NOMETUDIANT || '',
          PRENOMETUDIANT: rapport.etudiant?.PRENOMETUDIANT || '',
          ETABLISSEMENT: rapport.etudiant?.ETABLISSEMENT || '',
          FILIERE: rapport.etudiant?.FILIERE || '',
          NIVEAU: rapport.etudiant?.NIVEAU || '',
          // Informations du dossier (si trouvé)
          ETAT_DOSSIER: dossierInfo?.ETAT || 'Non défini',
          DATEDEPOT_DOSSIER: dossierInfo?.DATEDEPOT,
          THEME_DOSSIER: dossierInfo?.THEME || '',
          // Calcul de l'âge du rapport en jours
          AGE_JOURS: Math.floor((new Date() - new Date(rapport.DATE)) / (1000 * 60 * 60 * 24))
        };
      })
    );

    res.json(rapportsAvecFichier);
  } catch (error) {
    console.error('Erreur récupération historique global:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des rapports' });
  }
};

// --- 2. RÉCUPÉRER LA LISTE DES RAPPORTS SPÉCIAUX (UTILES) ---
exports.getHistoriqueSpeciaux = async (req, res) => {
  try {
    const rapports = await req.prisma.rapport.findMany({
      where: {
        COMMENTAIRE: 'utile'
      },
      select: {
        IDDOSSIER: true,
        MATRICULE: true,
        COMMENTAIRE: true,
        THEME: true,
        FICHIER: true,
        DATE: true,
        etudiant: {
          select: {
            NOMETUDIANT: true,
            PRENOMETUDIANT: true,
            ETABLISSEMENT: true,
            FILIERE: true,
            NIVEAU: true
          }
        }
      },
      orderBy: {
        DATE: 'desc'
      }
    });

    if (rapports.length === 0) {
      return res.json([]);
    }

    // Construire l'URL de base pour les fichiers
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    // Pour chaque rapport spécial, chercher le dossier correspondant
    const rapportsSpeciaux = await Promise.all(
      rapports.map(async (rapport) => {
        // Chercher le dossier de l'étudiant
        let dossierInfo = null;
        try {
          dossierInfo = await req.prisma.dossier.findFirst({
            where: {
              MATRICULEETUDIANT: rapport.MATRICULE
            },
            select: {
              ETAT: true,
              DATEDEPOT: true,
              THEME: true
            }
          });
        } catch (error) {
          console.log(`Dossier non trouvé pour ${rapport.MATRICULE}`);
        }

        return {
          IDDOSSIER: rapport.IDDOSSIER,
          MATRICULE: rapport.MATRICULE,
          COMMENTAIRE: rapport.COMMENTAIRE,
          THEME: rapport.THEME,
          FICHIER: rapport.FICHIER ? `${baseUrl}/uploads/rapports/${rapport.FICHIER}` : null,
          DATE: rapport.DATE,
          // Formater la date pour l'affichage
          DATE_FORMATTEE: new Date(rapport.DATE).toLocaleDateString('fr-FR'),
          // Informations de l'étudiant
          NOMETUDIANT: rapport.etudiant?.NOMETUDIANT || '',
          PRENOMETUDIANT: rapport.etudiant?.PRENOMETUDIANT || '',
          ETABLISSEMENT: rapport.etudiant?.ETABLISSEMENT || '',
          FILIERE: rapport.etudiant?.FILIERE || '',
          NIVEAU: rapport.etudiant?.NIVEAU || '',
          // Informations du dossier (si trouvé)
          ETAT_DOSSIER: dossierInfo?.ETAT || 'Non défini',
          DATEDEPOT_DOSSIER: dossierInfo?.DATEDEPOT,
          THEME_DOSSIER: dossierInfo?.THEME || '',
          // Calcul de l'âge du rapport en jours
          AGE_JOURS: Math.floor((new Date() - new Date(rapport.DATE)) / (1000 * 60 * 60 * 24))
        };
      })
    );

    res.json(rapportsSpeciaux);
  } catch (error) {
    console.error('Erreur récupération historiques spéciaux:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports spéciaux' });
  }
};

// --- 3. RÉCUPÉRER LES RAPPORTS PAR NIVEAU D'IMPORTANCE ---
exports.getRapportsParImportance = async (req, res) => {
  try {
    const { importance } = req.params; // 'normal', 'important', 'utile'
    
    const rapports = await req.prisma.rapport.findMany({
      where: {
        COMMENTAIRE: importance
      },
      select: {
        IDDOSSIER: true,
        MATRICULE: true,
        COMMENTAIRE: true,
        THEME: true,
        FICHIER: true,
        DATE: true,
        etudiant: {
          select: {
            NOMETUDIANT: true,
            PRENOMETUDIANT: true,
            ETABLISSEMENT: true,
            FILIERE: true,
            NIVEAU: true
          }
        }
      },
      orderBy: {
        DATE: 'desc'
      }
    });

    // Construire l'URL de base pour les fichiers
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    // Pour chaque rapport, chercher le dossier correspondant
    const rapportsAvecFichier = await Promise.all(
      rapports.map(async (rapport) => {
        // Chercher le dossier de l'étudiant
        let dossierInfo = null;
        try {
          dossierInfo = await req.prisma.dossier.findFirst({
            where: {
              MATRICULEETUDIANT: rapport.MATRICULE
            },
            select: {
              ETAT: true,
              DATEDEPOT: true,
              THEME: true
            }
          });
        } catch (error) {
          console.log(`Dossier non trouvé pour ${rapport.MATRICULE}`);
        }

        return {
          IDDOSSIER: rapport.IDDOSSIER,
          MATRICULE: rapport.MATRICULE,
          COMMENTAIRE: rapport.COMMENTAIRE,
          THEME: rapport.THEME,
          FICHIER: rapport.FICHIER,
          FICHIER_URL: rapport.FICHIER ? `${baseUrl}/uploads/rapports/${rapport.FICHIER}` : null,
          DATE: rapport.DATE,
          DATE_FORMATTEE: new Date(rapport.DATE).toLocaleDateString('fr-FR'),
          NOMETUDIANT: rapport.etudiant?.NOMETUDIANT || '',
          PRENOMETUDIANT: rapport.etudiant?.PRENOMETUDIANT || '',
          ETABLISSEMENT: rapport.etudiant?.ETABLISSEMENT || '',
          FILIERE: rapport.etudiant?.FILIERE || '',
          NIVEAU: rapport.etudiant?.NIVEAU || '',
          // Informations du dossier (si trouvé)
          ETAT_DOSSIER: dossierInfo?.ETAT || 'Non défini',
          DATEDEPOT_DOSSIER: dossierInfo?.DATEDEPOT,
          THEME_DOSSIER: dossierInfo?.THEME || ''
        };
      })
    );

    res.json(rapportsAvecFichier);
  } catch (error) {
    console.error('Erreur récupération rapports par importance:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports' });
  }
};