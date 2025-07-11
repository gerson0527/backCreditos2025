module.exports = {
  up: async (queryInterface, Sequelize) => {
    const financieras = [];
    const especializaciones = ['Préstamos personales', 'Microcréditos', 'Créditos vehiculares', 'Créditos hipotecarios'];

    for (let i = 1; i <= 10; i++) {
      financieras.push({
        nombre: `Financiera ${i}`,
        especializacion: especializaciones[Math.floor(Math.random() * especializaciones.length)],
        personaContacto: `Ejecutivo ${i}`,
        telefono: `9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        email: `contacto@financiera${i}.com.pe`,
        tasaPromedio: (Math.random() * 10 + 10).toFixed(2),
        comisionfin: (Math.random() * 3 + 1).toFixed(2),
        descripcion: `Financiera especializada en soluciones crediticias ${i}`,
        estado: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Financieras', financieras);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Financieras', null, {});
  }
};