module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [clientes] = await queryInterface.sequelize.query('SELECT id FROM Clientes;');
    const [asesores] = await queryInterface.sequelize.query('SELECT id FROM Asesor;');
    const [bancos] = await queryInterface.sequelize.query('SELECT id FROM Bancos;');
    const [financieras] = await queryInterface.sequelize.query('SELECT id FROM Financieras;');

    const creditos = [];
    const tipos = ['Personal', 'Hipotecario', 'Vehicular', 'Microempresa'];
    const estados = ['Aprobado', 'En Revisión', 'Pendiente', 'Rechazado'];
    const garantias = ['Ninguna', 'Propiedad', 'Vehículo', 'Aval'];

    // OBTENER MES Y AÑO ACTUAL
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear(); // 2025
    const mesActual = fechaActual.getMonth(); // 6 (julio, ya que enero = 0)
    
    // Obtener último día del mes actual
    const ultimoDiaDelMes = new Date(añoActual, mesActual + 1, 0).getDate();

    for (let i = 1; i <= 400; i++) {
      // FECHA DE SOLICITUD: Día aleatorio del mes actual
      const diaAleatorio = Math.floor(Math.random() * ultimoDiaDelMes) + 1;
      const fechaSolicitud = new Date(añoActual, mesActual, diaAleatorio);
      
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const plazo = [12, 24, 36, 48, 60][Math.floor(Math.random() * 5)];
      
      // Generar montos más variados para pruebas de comisiones
      let monto;
      const tipoMonto = Math.random();
      
      if (tipoMonto < 0.3) {
        // 30% - Montos pequeños (< 1M) - NO generan comisión
        monto = Math.floor(Math.random() * 900000) + 100000; // 100K - 999K
      } else if (tipoMonto < 0.7) {
        // 40% - Montos medianos (1M - 10M) - Generan comisión básica
        monto = Math.floor(Math.random() * 9000000) + 1000000; // 1M - 10M
      } else {
        // 30% - Montos grandes (10M - 100M) - Generan comisiones altas
        monto = Math.floor(Math.random() * 90000000) + 10000000; // 10M - 100M
      }
      
      creditos.push({
        id: `CRD-2025${String(i).padStart(4, '0')}`,
        clienteId: clientes[Math.floor(Math.random() * clientes.length)].id,
        asesorId: asesores[Math.floor(Math.random() * asesores.length)].id,
        financieraId: financieras[Math.floor(Math.random() * financieras.length)].id,
        bancoId: bancos[Math.floor(Math.random() * bancos.length)].id,
        monto: monto,
        tasa: `${(Math.random() * 15 + 10).toFixed(1)}%`,
        plazo: plazo,
        tipo: tipos[Math.floor(Math.random() * tipos.length)],
        garantia: garantias[Math.floor(Math.random() * garantias.length)],
        estado: estado,
        fechaSolicitud: fechaSolicitud,
        
        // Fechas de rechazo y aprobación basadas en la fecha de solicitud
        fechaRechazo: estado === 'Rechazado' ? 
          new Date(fechaSolicitud.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        fechaAprobacion: estado === 'Aprobado' ? 
          new Date(fechaSolicitud.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        fechaVencimiento: new Date(fechaSolicitud.getTime() + plazo * 30 * 24 * 60 * 60 * 1000),
        observaciones: `Observaciones del crédito ${i} - Solicitud ${fechaSolicitud.toLocaleDateString('es-CO')}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Creditos', creditos, {});
    
    console.log(`✅ Insertados ${creditos.length} créditos con fechas del mes actual (${añoActual}-${String(mesActual + 1).padStart(2, '0')})`);
    console.log(`📅 Rango de fechas: ${añoActual}-${String(mesActual + 1).padStart(2, '0')}-01 a ${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${ultimoDiaDelMes}`);
    console.log(`💰 Distribución de montos:`);
    console.log(`   - 30% menores a $1M (no generan comisión)`);
    console.log(`   - 40% entre $1M-$10M (comisión básica)`);
    console.log(`   - 30% entre $10M-$100M (comisión alta)`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Creditos', null, {});
  }
};