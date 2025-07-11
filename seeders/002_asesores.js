module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const asesores = [];
      const sucursales = ['Lima Centro', 'Lima Norte', 'Lima Sur', 'Lima Este', 'Callao'];
      const cargos = ['Asesor Senior', 'Asesor Junior', 'Asesor Principal', 'Asesor Comercial'];
      const rendimientos = ['Alto', 'Medio', 'Bajo'];

      for (let i = 1; i <= 5; i++) {
        const experienciaAnos = Math.floor(Math.random() * 15) + 1;
        const creditos = Math.floor(Math.random() * 50) + 1;
        const tasaAprobacion = Math.floor(Math.random() * 30) + 70;

        asesores.push({
          nombre: `Asesor ${i}`,
          cargo: cargos[Math.floor(Math.random() * cargos.length)],
          email: `asesor${i}@financiera.com`,
          telefono: `9${Math.floor(Math.random() * 90000000 + 10000000)}`,
          sucursal: sucursales[Math.floor(Math.random() * sucursales.length)],
          experienciaPrev: `${experienciaAnos} años en el sector financiero`,
          fechaIngreso: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          creditos: creditos,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await queryInterface.bulkInsert('Asesor', asesores);
    } catch (error) {
      console.error('Error en Asesores seeder:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Asesor', null, {});
  }
};