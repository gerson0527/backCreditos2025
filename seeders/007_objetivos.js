module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [asesores] = await queryInterface.sequelize.query('SELECT id FROM Asesor;');
    
    const objetivos = [];
    const tipos = ['VENTAS', 'CAPTACION', 'COLOCACION'];
    const unidades = ['USD', 'Clientes', 'Contratos'];
    const prioridades = ['ALTA', 'MEDIA', 'BAJA'];
    const estados = ['COMPLETADO', 'EN_PROGRESO'];

    for (let i = 1; i <= 2; i++) {
      const tipoIndex = Math.floor(Math.random() * tipos.length);
      const fechaInicio = new Date(2023, Math.floor(Math.random() * 12), 1);
      const fechaFin = new Date(fechaInicio.getTime() + 90 * 24 * 60 * 60 * 1000);

      objetivos.push({
        titulo: `Objetivo ${i} - ${tipos[tipoIndex]}`,
        tipo: tipos[tipoIndex],
        unidad: unidades[tipoIndex],
        descripcion: `Meta trimestral ${i}`,
        meta: tipoIndex === 0 ? Math.floor(Math.random() * 90000) + 10000 : Math.floor(Math.random() * 45) + 5,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        asesorId: asesores[Math.floor(Math.random() * asesores.length)].id,
        prioridad: prioridades[Math.floor(Math.random() * prioridades.length)],
        estado: estados[Math.floor(Math.random() * estados.length)],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Objetivos', objetivos);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Objetivos', null, {});
  }
};