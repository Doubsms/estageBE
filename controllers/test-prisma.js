// controllers/test-prisma.js
const testPrisma = async (req, res) => {
  console.log('=== DÉBUT TEST PRISMA DÉTAILLÉ ===');
  
  try {
    // 1. Vérifier que req.prisma existe
    console.log('1. Vérification de req.prisma...');
    if (!req.prisma) {
      console.error('❌ req.prisma est undefined');
      return res.status(500).json({ error: 'req.prisma est undefined' });
    }
    console.log('✅ req.prisma existe');
    
    // 2. Lister tous les modèles disponibles
    console.log('2. Modèles disponibles dans Prisma:');
    const prismaKeys = Object.keys(req.prisma);
    const modelKeys = prismaKeys.filter(k => !k.startsWith('$'));
    console.log('Modèles:', modelKeys);
    
    // 3. Tester chaque modèle un par un
    const results = {};
    
    // Test 1: administrateur
    console.log('3. Test du modèle "administrateur"...');
    try {
      const adminCount = await req.prisma.administrateur.count();
      results.administrateur = { count: adminCount, status: '✅ OK' };
      console.log(`✅ administrateur: ${adminCount} enregistrements`);
    } catch (err) {
      results.administrateur = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ administrateur: ${err.message}`);
    }
    
    // Test 2: etudiant
    console.log('4. Test du modèle "etudiant"...');
    try {
      const etudiantCount = await req.prisma.etudiant.count();
      results.etudiant = { count: etudiantCount, status: '✅ OK' };
      console.log(`✅ etudiant: ${etudiantCount} enregistrements`);
    } catch (err) {
      results.etudiant = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ etudiant: ${err.message}`);
    }
    
    // Test 3: structures
    console.log('5. Test du modèle "structures"...');
    try {
      const structuresCount = await req.prisma.structures.count();
      results.structures = { count: structuresCount, status: '✅ OK' };
      console.log(`✅ structures: ${structuresCount} enregistrements`);
    } catch (err) {
      results.structures = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ structures: ${err.message}`);
    }
    
    // Test 4: encadreur
    console.log('6. Test du modèle "encadreur"...');
    try {
      const encadreurCount = await req.prisma.encadreur.count();
      results.encadreur = { count: encadreurCount, status: '✅ OK' };
      console.log(`✅ encadreur: ${encadreurCount} enregistrements`);
    } catch (err) {
      results.encadreur = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ encadreur: ${err.message}`);
    }
    
    // Test 5: dossier
    console.log('7. Test du modèle "dossier"...');
    try {
      const dossierCount = await req.prisma.dossier.count();
      results.dossier = { count: dossierCount, status: '✅ OK' };
      console.log(`✅ dossier: ${dossierCount} enregistrements`);
    } catch (err) {
      results.dossier = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ dossier: ${err.message}`);
    }
    
    // Test 6: affectation
    console.log('8. Test du modèle "affectation"...');
    try {
      const affectationCount = await req.prisma.affectation.count();
      results.affectation = { count: affectationCount, status: '✅ OK' };
      console.log(`✅ affectation: ${affectationCount} enregistrements`);
    } catch (err) {
      results.affectation = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ affectation: ${err.message}`);
    }
    
    // Test 7: rapport
    console.log('9. Test du modèle "rapport"...');
    try {
      const rapportCount = await req.prisma.rapport.count();
      results.rapport = { count: rapportCount, status: '✅ OK' };
      console.log(`✅ rapport: ${rapportCount} enregistrements`);
    } catch (err) {
      results.rapport = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ rapport: ${err.message}`);
    }
    
    // Test 8: logs_actions
    console.log('10. Test du modèle "logs_actions"...');
    try {
      const logsCount = await req.prisma.logs_actions.count();
      results.logs_actions = { count: logsCount, status: '✅ OK' };
      console.log(`✅ logs_actions: ${logsCount} enregistrements`);
    } catch (err) {
      results.logs_actions = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ logs_actions: ${err.message}`);
    }
    
    // 4. Faire une requête de test simple avec findMany
    console.log('11. Test findMany sur etudiant...');
    try {
      const etudiants = await req.prisma.etudiant.findMany({
        take: 2,
        select: {
          MATRICULEETUDIANT: true,
          NOMETUDIANT: true,
          PRENOMETUDIANT: true
        }
      });
      results.findManyTest = { 
        status: '✅ OK', 
        sample: etudiants,
        count: etudiants.length 
      };
      console.log(`✅ findMany: ${etudiants.length} étudiants récupérés`);
    } catch (err) {
      results.findManyTest = { error: err.message, status: '❌ Erreur' };
      console.error(`❌ findMany: ${err.message}`);
    }
    
    console.log('=== FIN TEST PRISMA ===');
    
    res.json({
      message: 'Résultats des tests Prisma',
      timestamp: new Date().toISOString(),
      availableModels: modelKeys,
      testResults: results,
      summary: {
        success: Object.values(results).filter(r => r.status === '✅ OK').length,
        errors: Object.values(results).filter(r => r.status === '❌ Erreur').length,
        totalTests: Object.keys(results).length
      }
    });
    
  } catch (error) {
    console.error('=== ERREUR GLOBALE DANS TEST PRISMA ===');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Erreur globale dans test Prisma',
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { testPrisma };