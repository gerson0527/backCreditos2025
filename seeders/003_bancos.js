module.exports = {
  up: async (queryInterface, Sequelize) => {
    const bancos = [];
    const tiposBanco = ['Banca múltiple', 'Banca especializada', 'Banca de inversión'];
    const distritos = ['San Isidro', 'Miraflores', 'La Molina', 'Surco', 'San Borja'];

    for (let i = 1; i <= 10; i++) {
      bancos.push({
        nombre: `Banco ${i}`,
        tipo: tiposBanco[Math.floor(Math.random() * tiposBanco.length)],
        personaContacto: `Contacto ${i}`,
        telefono: `9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        email: `contacto${i}@banco${i}.com.pe`,
        tasaBase: (Math.random() * 5 + 5).toFixed(2),
        comisionban: (Math.random() * 2 + 1).toFixed(2),
        direccion: `Av. Principal ${i}, ${distritos[Math.floor(Math.random() * distritos.length)]}`,
        estado: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Bancos', bancos);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Bancos', null, {});
  }
};