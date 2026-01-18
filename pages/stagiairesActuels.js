// --- 1. RÉCUPÉRER LES STAGIAIRES ACTUELS (EN COURS DE STAGE) ---
exports.getStagiaresActuels = async (req, res) => {
    try {
        // Date actuelle pour comparer
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit pour comparaison correcte

        // Récupérer tous les dossiers acceptés dont la date de fin >= aujourd'hui
        const dossiers = await req.prisma.dossier.findMany({
            where: {
                ETAT: 'accepté',
                DATEFINDESEANCE: {
                    gte: today  // gte = greater than or equal (>=)
                }
            },
            include: {
                etudiant: true,      // Relation vers l'étudiant
                affectation: {       // Relation vers l'affectation (array)
                    include: {
                        encadreur: true,    // Relation vers l'encadreur
                        structures: true    // Relation vers la structure
                    }
                }
            }
        });

        if (dossiers.length === 0) {
            return res.json([]); // Retourne un tableau vide si aucun stagiaire actuel
        }

        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        
        // Fonction pour formater les dates au format DD/MM/YYYY (comme avant)
        const formatDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        
        // Transformer les données pour correspondre au format attendu par le front
        const data = dossiers.map(d => {
            const etudiant = d.etudiant;
            const affectation = d.affectation[0]; // Prendre la première affectation
            const encadreur = affectation?.encadreur;
            const structure = affectation?.structures;

            return {
                // Données étudiant
                MATRICULEETUDIANT: etudiant?.MATRICULEETUDIANT || null,
                NOMETUDIANT: etudiant?.NOMETUDIANT || null,
                PRENOMETUDIANT: etudiant?.PRENOMETUDIANT || null,
                ETABLISSEMENT: etudiant?.ETABLISSEMENT || null,
                NIVEAU: etudiant?.NIVEAU || null,
                PARCOURS: etudiant?.PARCOURS || null,
                FILIERE: etudiant?.FILIERE || null,
                TEL: etudiant?.TEL || null,
                DATE: etudiant?.DATE || null,
                SEXE: etudiant?.SEXE || null,
                
                // Données dossier (dates formatées et thème)
                DATEDEBUTDESEANCE: formatDate(d.DATEDEBUTDESEANCE),  // ✅ Format DD/MM/YYYY
                DATEFINDESEANCE: formatDate(d.DATEFINDESEANCE),      // ✅ Format DD/MM/YYYY
                THEME: d.THEME || null,
                PHOTOPROFIL: d.PHOTOPROFIL ? `${baseUrl}${d.PHOTOPROFIL}` : null,
                
                // Données encadreur
                NOMENCADREUR: encadreur?.NOMENCADREUR || null,
                PRENOMENCADREUR: encadreur?.PRENOMENCADREUR || null,
                POSTE: encadreur?.POSTE || null,
                
                // Données structure
                NOMSTRUCTURE: structure?.NOMSTRUCTURE || null,
                ABBREVIATION: structure?.ABBREVIATION || null
            };
        });

        res.json(data);
        
    } catch (error) {
        console.error('❌ Erreur Prisma - Récupération Stagiaires Actuels:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des stagiaires actuels',
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message 
            })
        });
    }
};

// --- 2. METTRE À JOUR LE THÈME D'UN DOSSIER ---
exports.updateTheme = async (req, res) => {
    const { MATRICULEETUDIANT, THEME } = req.body;

    // Validation des champs obligatoires
    if (!MATRICULEETUDIANT || !THEME) {
        return res.status(400).json({ 
            success: false,
            error: 'Matricule et Thème sont requis' 
        });
    }

    try {
        // Vérifier si un dossier existe pour ce matricule
        const dossierExistant = await req.prisma.dossier.findFirst({
            where: { MATRICULEETUDIANT: MATRICULEETUDIANT }
        });

        if (!dossierExistant) {
            return res.status(404).json({ 
                success: false,
                error: 'Aucun dossier trouvé avec ce matricule' 
            });
        }

        // Mettre à jour le thème
        const dossierMisAJour = await req.prisma.dossier.update({
            where: { IDDOSSIER: dossierExistant.IDDOSSIER },
            data: { THEME: THEME }
        });

        res.json({ 
            success: true,
            message: 'Thème mis à jour avec succès',
            dossier: {
                IDDOSSIER: dossierMisAJour.IDDOSSIER,
                MATRICULEETUDIANT: dossierMisAJour.MATRICULEETUDIANT,
                THEME: dossierMisAJour.THEME
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur Prisma - Mise à jour Thème:', error);
        
        // Gestion spécifique des erreurs Prisma
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                success: false,
                error: 'Dossier non trouvé' 
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la mise à jour du thème',
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
                code: error.code
            })
        });
    }
};