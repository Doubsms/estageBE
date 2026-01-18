// --- 3. RÉCUPÉRER TOUS LES STAGIAIRES ACCEPTÉS ---
exports.getStagiaresAccepte = async (req, res) => {
    try {
        // Récupérer tous les dossiers acceptés avec leurs relations
        const dossiers = await req.prisma.dossier.findMany({
            where: {
                ETAT: 'accepté'
            },
            include: {
                etudiant: true,      // Relation vers l'étudiant
                affectation: {       // Relation vers l'affectation (array)
                    include: {
                        encadreur: true,    // Relation vers l'encadreur
                        structures: {       // Relation vers la structure
                            include: {
                                other_structures: true // Pour remonter la hiérarchie
                            }
                        }
                    }
                }
            }
        });

        if (dossiers.length === 0) {
            return res.json([]);
        }

        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        
        // Transformer les données pour correspondre au format attendu par le front
        const data = await Promise.all(dossiers.map(async (d) => {
            const etudiant = d.etudiant;
            const affectation = d.affectation[0]; // Prendre la première affectation
            const encadreur = affectation?.encadreur;
            const structure = affectation?.structures;
            
            // Fonction pour construire la hiérarchie complète
            const getHierarchieComplete = async (structureId) => {
                if (!structureId) return '';
                
                const hierachie = [];
                let currentStructure = await req.prisma.structures.findUnique({
                    where: { IDSTRUCTURE: structureId },
                    select: { ABBREVIATION: true, IDPARENT: true, NOMSTRUCTURE: true }
                });
                
                while (currentStructure) {
                    hierachie.unshift(currentStructure.ABBREVIATION); // Ajouter au début pour avoir l'ordre racine -> feuille
                    
                    if (currentStructure.IDPARENT) {
                        currentStructure = await req.prisma.structures.findUnique({
                            where: { IDSTRUCTURE: currentStructure.IDPARENT },
                            select: { ABBREVIATION: true, IDPARENT: true, NOMSTRUCTURE: true }
                        });
                    } else {
                        break;
                    }
                }
                
                // Remplacer DG par INS s'il est présent
                const hierachieFormatee = hierachie.map(abrev => 
                    abrev === 'DG' ? 'INS' : abrev
                );
                
                return hierachieFormatee.join('/');
            };

            // Obtenir la hiérarchie complète si une structure existe
            let hierachie = '';
            if (structure?.IDSTRUCTURE) {
                hierachie = await getHierarchieComplete(structure.IDSTRUCTURE);
            }

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
                
                // Données dossier (dates et thème)
                DATEDEBUTDESEANCE: d.DATEDEBUTDESEANCE,
                DATEFINDESEANCE: d.DATEFINDESEANCE,
                THEME: d.THEME || null,
                PHOTOPROFIL: d.PHOTOPROFIL ? `${baseUrl}${d.PHOTOPROFIL}` : null,
                
                // Données encadreur
                NOMENCADREUR: encadreur?.NOMENCADREUR || null,
                PRENOMENCADREUR: encadreur?.PRENOMENCADREUR || null,
                POSTE: encadreur?.POSTE || null,
                
                // Données structure
                NOMSTRUCTURE: structure?.NOMSTRUCTURE || null,
                ABBREVIATION: structure?.ABBREVIATION || null,
                
                // Nouveau champ : Hiérarchie complète
                HIERARCHIE: hierachie
            };
        }));

        res.json(data);
        
    } catch (error) {
        console.error('❌ Erreur Prisma - Récupération Stagiaires Acceptés:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des stagiaires',
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message 
            })
        });
    }
};