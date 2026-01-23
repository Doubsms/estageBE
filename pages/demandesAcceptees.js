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
            
            // Fonction pour remonter jusqu'au département parent (niveau 1 après DG)
            const getDepartementParent = async (structureId) => {
                if (!structureId) return { hierarchie: '', departement: '' };
                
                const hierachie = [];
                let currentStructure = await req.prisma.structures.findUnique({
                    where: { IDSTRUCTURE: structureId },
                    select: { 
                        IDSTRUCTURE: true,
                        ABBREVIATION: true, 
                        NOMSTRUCTURE: true,
                        IDPARENT: true 
                    }
                });
                
                let departementParent = null;
                
                // Remonter la hiérarchie complète
                while (currentStructure) {
                    hierachie.unshift({
                        id: currentStructure.IDSTRUCTURE,
                        abbreviation: currentStructure.ABBREVIATION,
                        nom: currentStructure.NOMSTRUCTURE,
                        parent: currentStructure.IDPARENT
                    });
                    
                    if (currentStructure.IDPARENT) {
                        currentStructure = await req.prisma.structures.findUnique({
                            where: { IDSTRUCTURE: currentStructure.IDPARENT },
                            select: { 
                                IDSTRUCTURE: true,
                                ABBREVIATION: true, 
                                NOMSTRUCTURE: true,
                                IDPARENT: true 
                            }
                        });
                    } else {
                        break;
                    }
                }
                
                // Trouver le département parent (premier enfant direct de DG/Direction Générale)
                for (let i = 0; i < hierachie.length; i++) {
                    const structure = hierachie[i];
                    
                    // Vérifier si le parent est DG (ID 2 selon vos données)
                    if (structure.parent === 2) {
                        departementParent = structure;
                        break;
                    }
                }
                
                // Construire la hiérarchie formatée
                const hierachieFormatee = hierachie.map(s => 
                    s.abbreviation === 'DG' ? 'INS' : s.abbreviation
                ).join('/');
                
                return {
                    hierarchie: hierachieFormatee,
                    departement: departementParent ? departementParent.abbreviation : '',
                    departementNom: departementParent ? departementParent.nom : ''
                };
            };

            // Obtenir la hiérarchie complète et le département parent si une structure existe
            let hierarchieData = { hierarchie: '', departement: '', departementNom: '' };
            if (structure?.IDSTRUCTURE) {
                hierarchieData = await getDepartementParent(structure.IDSTRUCTURE);
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
                IDDOSSIER: d.IDDOSSIER,
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
                
                // Hiérarchie complète et département parent
                HIERARCHIE: hierarchieData.hierarchie,
                DEPARTEMENT: hierarchieData.departement,
                DEPARTEMENTNOM: hierarchieData.departementNom
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