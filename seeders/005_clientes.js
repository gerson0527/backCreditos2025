module.exports = {
  up: async (queryInterface, Sequelize) => {
    const clientes = [];

    for (let i = 1; i <= 10; i++) {
      const ingresos = Math.floor(Math.random() * 7000) + 3000;
      const creditosActivos = Math.floor(Math.random() * 4);
      
      clientes.push({
        nombre: `Cliente Nombre ${i}`,
        apellido: `Cliente Apellido ${i}`,
        dni: String(10000000 + i).padStart(8, '0'),
        email: `cliente${i}@email.com`,
        telefono: `9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        direccion: `Calle Cliente ${i}, Lima`,
        fechanacimiento: new Date(1970 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        ingresosMensuales: ingresos,
        creditosActivos: creditosActivos,
        estado: 'Activo',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Clientes', clientes);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Clientes', null, {});
  }
};