'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener algunos usuarios existentes para crear mensajes de prueba
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 4',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length < 2) {
      console.log('No hay suficientes usuarios para crear mensajes de prueba');
      return;
    }

    const messages = [
      {
        sender_id: users[0].id,
        receiver_id: users[1].id,
        message: 'Hola, ¿cómo estás? Necesito revisar algunos créditos contigo.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sender_id: users[1].id,
        receiver_id: users[0].id,
        message: '¡Hola! Todo bien por aquí. Claro, podemos revisar los créditos esta tarde.',
        timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 minutos atrás
        is_read: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sender_id: users[0].id,
        receiver_id: users[1].id,
        message: 'Perfecto, ¿a qué hora te viene bien?',
        timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutos atrás
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Solo agregar más mensajes si hay más usuarios
    if (users.length >= 3) {
      messages.push(
        {
          sender_id: users[2].id,
          receiver_id: users[0].id,
          message: 'Buenos días, ¿podrías revisar el reporte de comisiones de este mes?',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
          is_read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          sender_id: users[0].id,
          receiver_id: users[2].id,
          message: 'Claro, lo reviso ahora mismo y te comento.',
          timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutos atrás
          is_read: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    if (users.length >= 4) {
      messages.push(
        {
          sender_id: users[3].id,
          receiver_id: users[1].id,
          message: '¿Has visto los nuevos objetivos de ventas para este trimestre?',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
          is_read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          sender_id: users[1].id,
          receiver_id: users[3].id,
          message: 'Sí, los acabo de revisar. Creo que son alcanzables si nos organizamos bien.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
          is_read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    await queryInterface.bulkInsert('messages', messages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('messages', null, {});
  }
};
