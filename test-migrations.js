const { runMigrations } = require('./src/config/database');

async function testMigrations() {
  console.log('🧪 Probando ejecución de migraciones...');
  
  try {
    const result = await runMigrations();
    console.log('✅ Resultado:', result);
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
  
  process.exit(0);
}

testMigrations();
