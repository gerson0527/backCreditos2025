const db = require('../../models');
const Comision = db.Comision;
const Asesor = db.Asesor;
const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Función para generar el archivo TXT con el resumen de comisiones AGRUPADO POR ASESOR
const generarArchivoTXT = (comisiones, periodo, asesorId = null) => {
  const fechaGeneracion = new Date().toLocaleString('es-CO');
  const totalComisiones = comisiones.reduce((sum, c) => sum + c.comisionTotal, 0);
  
  // AGRUPAR COMISIONES POR ASESOR
  const comisionesPorAsesor = {};
  
  comisiones.forEach(comision => {
    const asesorKey = comision.asesorId;
    
    if (!comisionesPorAsesor[asesorKey]) {
      comisionesPorAsesor[asesorKey] = {
        asesorId: comision.asesorId,
        asesorNombre: comision.asesorNombre,
        entidades: [],
        totalCreditos: 0,
        totalMontoGestionado: 0,
        totalComision: 0,
        entidadesList: []
      };
    }
    
    // Agregar entidad al asesor
    comisionesPorAsesor[asesorKey].entidades.push({
      nombre: comision.entidadNombre,
      tipo: comision.tipoEntidad,
      creditos: comision.creditosAprobados,
      monto: comision.montoTotalGestionado,
      comisionPorMillon: comision.comisionPorMillon,
      comision: comision.comisionTotal,
      millonesGestionados: Math.floor(comision.montoTotalGestionado / 1000000)
    });
    
    // Sumar totales
    comisionesPorAsesor[asesorKey].totalCreditos += comision.creditosAprobados;
    comisionesPorAsesor[asesorKey].totalMontoGestionado += comision.montoTotalGestionado;
    comisionesPorAsesor[asesorKey].totalComision += comision.comisionTotal;
    
    // Lista de entidades únicas
    if (!comisionesPorAsesor[asesorKey].entidadesList.includes(comision.entidadNombre)) {
      comisionesPorAsesor[asesorKey].entidadesList.push(comision.entidadNombre);
    }
  });
  
  // Convertir a array y ordenar por comisión total
  const asesoresOrdenados = Object.values(comisionesPorAsesor)
    .sort((a, b) => b.totalComision - a.totalComision);
  
  let contenido = `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          REPORTE DE COMISIONES CALCULADAS                           ║
║                            AGRUPADO POR ASESOR                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

📅 PERIODO: ${periodo}
📊 FECHA DE GENERACIÓN: ${fechaGeneracion}
👤 FILTRO DE ASESOR: ${asesorId ? 'Asesor específico' : 'Todos los asesores'}
🏦 SISTEMA: Comisión fija por cada millón de pesos (Sistema Colombiano)

═══════════════════════════════════════════════════════════════════════════════════════
                                    RESUMEN GENERAL
═══════════════════════════════════════════════════════════════════════════════════════

💰 TOTAL DE COMISIONES CALCULADAS: $${totalComisiones.toLocaleString('es-CO')} COP
👥 TOTAL DE ASESORES CON COMISIONES: ${asesoresOrdenados.length}
🏛️ DISTRIBUCIÓN POR ENTIDAD:
   • Bancos: ${comisiones.filter(c => c.tipoEntidad === 'Banco').length} comisiones
   • Financieras: ${comisiones.filter(c => c.tipoEntidad === 'Financiera').length} comisiones
📊 TOTAL DE CRÉDITOS: ${comisiones.reduce((sum, c) => sum + c.creditosAprobados, 0)}
💵 MONTO TOTAL GESTIONADO: $${comisiones.reduce((sum, c) => sum + c.montoTotalGestionado, 0).toLocaleString('es-CO')} COP

═══════════════════════════════════════════════════════════════════════════════════════
                           DETALLE DE COMISIONES POR ASESOR
═══════════════════════════════════════════════════════════════════════════════════════

`;

  asesoresOrdenados.forEach((asesor, index) => {
    const totalMillones = Math.floor(asesor.totalMontoGestionado / 1000000);
    const numeroEntidades = asesor.entidades.length;
    const entidadesTexto = asesor.entidadesList.join(', ');
    
    contenido += `
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ${(index + 1).toString().padStart(2, '0')}. ${asesor.asesorNombre.toUpperCase().padEnd(65, ' ')} │
└─────────────────────────────────────────────────────────────────────────────────────┘

👤 ASESOR: ${asesor.asesorNombre}
🏢 ENTIDADES TRABAJADAS: ${entidadesTexto}
🔢 NÚMERO DE ENTIDADES: ${numeroEntidades}

📊 RESUMEN TOTAL DEL ASESOR:
   📈 Total Créditos Aprobados: ${asesor.totalCreditos}
   💵 Total Monto Gestionado: $${asesor.totalMontoGestionado.toLocaleString('es-CO')} COP
   🔢 Total Millones Gestionados: ${totalMillones}
   💎 Total Comisión: $${asesor.totalComision.toLocaleString('es-CO')} COP

🏛️ DETALLE POR ENTIDAD:
`;

    asesor.entidades.forEach((entidad, entIndex) => {
      contenido += `
   ${entIndex + 1}. ${entidad.nombre} (${entidad.tipo})
      📈 Créditos: ${entidad.creditos}
      💵 Monto: $${entidad.monto.toLocaleString('es-CO')} COP
      🔢 Millones: ${entidad.millonesGestionados}
      💎 Comisión/Millón: $${entidad.comisionPorMillon.toLocaleString('es-CO')} COP
      🧮 Cálculo: ${entidad.millonesGestionados} × $${entidad.comisionPorMillon.toLocaleString('es-CO')} = $${entidad.comision.toLocaleString('es-CO')} COP
`;
    });

    contenido += `
✅ ESTADO: Pendiente
📅 PERIODO: ${periodo}

${index < asesoresOrdenados.length - 1 ? '═'.repeat(85) : ''}
`;
  });

  contenido += `
═══════════════════════════════════════════════════════════════════════════════════════
                                RANKING DE ASESORES
═══════════════════════════════════════════════════════════════════════════════════════

📊 TOP 10 ASESORES CON MAYORES COMISIONES:
`;

  const top10 = asesoresOrdenados.slice(0, 10);
  top10.forEach((asesor, index) => {
    const posicion = index + 1;
    const emoji = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : posicion === 3 ? '🥉' : '🏅';
    const porcentaje = ((asesor.totalComision / totalComisiones) * 100).toFixed(1);
    
    contenido += `
${emoji} ${posicion.toString().padStart(2, ' ')}. ${asesor.asesorNombre}
   💰 Comisión Total: $${asesor.totalComision.toLocaleString('es-CO')} COP (${porcentaje}%)
   🏢 Entidades: ${asesor.entidades.length} (${asesor.entidadesList.join(', ')})
   📈 Créditos: ${asesor.totalCreditos}
   💵 Monto Gestionado: $${asesor.totalMontoGestionado.toLocaleString('es-CO')} COP
`;
  });

  contenido += `

═══════════════════════════════════════════════════════════════════════════════════════
                                ESTADÍSTICAS DETALLADAS
═══════════════════════════════════════════════════════════════════════════════════════

📊 DISTRIBUCIÓN POR TIPO DE ENTIDAD:

🏦 BANCOS:
`;

  const estadisticasBancos = {
    asesores: new Set(),
    comisiones: 0,
    creditos: 0,
    monto: 0,
    entidades: new Set()
  };

  comisiones.filter(c => c.tipoEntidad === 'Banco').forEach(c => {
    estadisticasBancos.asesores.add(c.asesorNombre);
    estadisticasBancos.comisiones += c.comisionTotal;
    estadisticasBancos.creditos += c.creditosAprobados;
    estadisticasBancos.monto += c.montoTotalGestionado;
    estadisticasBancos.entidades.add(c.entidadNombre);
  });

  contenido += `   👥 Asesores que trabajaron con bancos: ${estadisticasBancos.asesores.size}
   🏛️ Bancos diferentes: ${estadisticasBancos.entidades.size}
   💰 Total comisiones: $${estadisticasBancos.comisiones.toLocaleString('es-CO')} COP
   📈 Total créditos: ${estadisticasBancos.creditos}
   💵 Total monto: $${estadisticasBancos.monto.toLocaleString('es-CO')} COP
   📊 Promedio por asesor: $${estadisticasBancos.asesores.size > 0 ? Math.round(estadisticasBancos.comisiones / estadisticasBancos.asesores.size).toLocaleString('es-CO') : '0'} COP

🏛️ FINANCIERAS:
`;

  const estadisticasFinancieras = {
    asesores: new Set(),
    comisiones: 0,
    creditos: 0,
    monto: 0,
    entidades: new Set()
  };

  comisiones.filter(c => c.tipoEntidad === 'Financiera').forEach(c => {
    estadisticasFinancieras.asesores.add(c.asesorNombre);
    estadisticasFinancieras.comisiones += c.comisionTotal;
    estadisticasFinancieras.creditos += c.creditosAprobados;
    estadisticasFinancieras.monto += c.montoTotalGestionado;
    estadisticasFinancieras.entidades.add(c.entidadNombre);
  });

  contenido += `   👥 Asesores que trabajaron con financieras: ${estadisticasFinancieras.asesores.size}
   🏛️ Financieras diferentes: ${estadisticasFinancieras.entidades.size}
   💰 Total comisiones: $${estadisticasFinancieras.comisiones.toLocaleString('es-CO')} COP
   📈 Total créditos: ${estadisticasFinancieras.creditos}
   💵 Total monto: $${estadisticasFinancieras.monto.toLocaleString('es-CO')} COP
   📊 Promedio por asesor: $${estadisticasFinancieras.asesores.size > 0 ? Math.round(estadisticasFinancieras.comisiones / estadisticasFinancieras.asesores.size).toLocaleString('es-CO') : '0'} COP

📈 ESTADÍSTICAS GENERALES:
   💎 Comisión promedio por asesor: $${Math.round(totalComisiones / asesoresOrdenados.length).toLocaleString('es-CO')} COP
   🔢 Promedio de créditos por asesor: ${Math.round(comisiones.reduce((sum, c) => sum + c.creditosAprobados, 0) / asesoresOrdenados.length)}
   💵 Promedio de monto por asesor: $${Math.round(comisiones.reduce((sum, c) => sum + c.montoTotalGestionado, 0) / asesoresOrdenados.length).toLocaleString('es-CO')} COP
   🏛️ Promedio de entidades por asesor: ${(comisiones.length / asesoresOrdenados.length).toFixed(1)}

═══════════════════════════════════════════════════════════════════════════════════════
                                LISTADO DE ENTIDADES
═══════════════════════════════════════════════════════════════════════════════════════

🏦 BANCOS TRABAJADOS:
`;

  const bancosUnicos = [...new Set(comisiones.filter(c => c.tipoEntidad === 'Banco').map(c => c.entidadNombre))];
  bancosUnicos.forEach((banco, index) => {
    const comisionesBanco = comisiones.filter(c => c.entidadNombre === banco);
    const asesoresBanco = [...new Set(comisionesBanco.map(c => c.asesorNombre))];
    const totalComisionBanco = comisionesBanco.reduce((sum, c) => sum + c.comisionTotal, 0);
    
    contenido += `
   ${index + 1}. ${banco}
      👥 Asesores: ${asesoresBanco.length} (${asesoresBanco.join(', ')})
      💰 Total comisiones: $${totalComisionBanco.toLocaleString('es-CO')} COP
      📈 Total créditos: ${comisionesBanco.reduce((sum, c) => sum + c.creditosAprobados, 0)}
`;
  });

  contenido += `
🏛️ FINANCIERAS TRABAJADAS:
`;

  const financierasUnicas = [...new Set(comisiones.filter(c => c.tipoEntidad === 'Financiera').map(c => c.entidadNombre))];
  financierasUnicas.forEach((financiera, index) => {
    const comisionesFinanciera = comisiones.filter(c => c.entidadNombre === financiera);
    const asesoresFinanciera = [...new Set(comisionesFinanciera.map(c => c.asesorNombre))];
    const totalComisionFinanciera = comisionesFinanciera.reduce((sum, c) => sum + c.comisionTotal, 0);
    
    contenido += `
   ${index + 1}. ${financiera}
      👥 Asesores: ${asesoresFinanciera.length} (${asesoresFinanciera.join(', ')})
      💰 Total comisiones: $${totalComisionFinanciera.toLocaleString('es-CO')} COP
      📈 Total créditos: ${comisionesFinanciera.reduce((sum, c) => sum + c.creditosAprobados, 0)}
`;
  });

  contenido += `

═══════════════════════════════════════════════════════════════════════════════════════
                                     INFORMACIÓN TÉCNICA
═══════════════════════════════════════════════════════════════════════════════════════

🔧 SISTEMA DE CÁLCULO: Comisión fija por cada millón de pesos
📝 FÓRMULA: FLOOR(Monto ÷ 1,000,000) × Comisión_por_millón
🎯 CRITERIOS: Solo créditos con estado: Aprobado, Desembolsado, Activo
📊 AGRUPACIÓN: Por asesor, mostrando detalle de cada entidad
🔢 TOTAL DE REGISTROS: ${comisiones.length} comisiones individuales
👥 TOTAL DE ASESORES: ${asesoresOrdenados.length} asesores únicos
📄 GENERADO POR: Sistema de Gestión de Comisiones v1.0

═══════════════════════════════════════════════════════════════════════════════════════
                                   FIN DEL REPORTE
═══════════════════════════════════════════════════════════════════════════════════════

`;

  return contenido;
};

// Calcular comisiones para un periodo específico basado en banco/financiera
exports.calcularComisionesPeriodo = async (req, res) => {
  try {
    const { periodo, asesorId } = req.body;
    
    if (!periodo) {
      return res.status(400).json({ message: 'El periodo es requerido (formato: YYYY-MM)' });
    }

    // Obtener primer y último día del mes
    const [año, mes] = periodo.split('-');
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0);
    
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];

    // Construir filtro de asesor si se especifica
    let whereClauseAsesor = '';
    let replacements = { fechaInicio: fechaInicioStr, fechaFin: fechaFinStr };
    
    if (asesorId) {
      whereClauseAsesor = 'AND a.id = :asesorId';
      replacements.asesorId = asesorId;
    }

    // DECLARAR VARIABLES FUERA DEL BLOQUE PARA USO POSTERIOR
    let asesoresSinComisiones = [];
    let idsAsesoresConComisiones = [];
    let nombresAsesoresConComisiones = [];

    // NUEVA LÓGICA DE VALIDACIÓN MEJORADA
    if (asesorId) {
      // CASO 1: Generación para asesor específico
      const comisionAsesorExiste = await Comision.findOne({
        where: { periodo: periodo, asesorId: asesorId }
      });

      if (comisionAsesorExiste) {
        return res.status(409).json({
          message: 'Ya existe comisión para este asesor en el periodo',
          tipo: 'asesor_ya_calculado',
          periodo: periodo,
          asesorId: asesorId,
          accion: 'Este asesor ya tiene comisión calculada para este periodo'
        });
      }
    } else {
      // CASO 2: Generación para todos los asesores
      
      // Obtener todos los asesores que tienen créditos en el periodo
      const asesoresConCreditos = await db.sequelize.query(`
        SELECT DISTINCT a.id, a.nombre
        FROM asesor a
        INNER JOIN Creditos c ON a.id = c.asesorId 
          AND c.fechaSolicitud BETWEEN :fechaInicio AND :fechaFin
          AND c.estado IN ('Aprobado')
          AND (c.bancoid IS NOT NULL OR c.financieraId IS NOT NULL)
        ORDER BY a.nombre
      `, {
        replacements: { fechaInicio: fechaInicioStr, fechaFin: fechaFinStr },
        type: QueryTypes.SELECT
      });

      // Obtener asesores que YA tienen comisiones calculadas
      const asesoresConComisiones = await Comision.findAll({
        where: { periodo: periodo },
        attributes: ['asesorId'],
        include: [{
          model: Asesor,
          as: 'asesor',
          attributes: ['nombre']
        }]
      });

      idsAsesoresConComisiones = asesoresConComisiones.map(c => c.asesorId);
      nombresAsesoresConComisiones = asesoresConComisiones.map(c => c.asesor.nombre);
      
      // Verificar si TODOS los asesores ya tienen comisiones
      asesoresSinComisiones = asesoresConCreditos.filter(a => 
        !idsAsesoresConComisiones.includes(a.id)
      );

      if (idsAsesoresConComisiones.length > 0 && asesoresSinComisiones.length === 0) {
        // TODOS los asesores ya tienen comisiones calculadas
        return res.status(409).json({
          message: 'Ya existen comisiones completas para este periodo',
          tipo: 'periodo_completo',
          periodo: periodo,
          totalAsesoresConCreditos: asesoresConCreditos.length,
          totalAsesoresConComisiones: idsAsesoresConComisiones.length,
          asesoresConComisiones: nombresAsesoresConComisiones,
          accion: 'Todos los asesores ya tienen comisiones calculadas para este periodo'
        });
      } else if (idsAsesoresConComisiones.length > 0) {
        // CAMBIO: En lugar de devolver error, continuar solo con asesores faltantes
        console.log(`Continuando con ${asesoresSinComisiones.length} asesores faltantes...`);
        console.log('Asesores sin comisiones:', asesoresSinComisiones.map(a => a.nombre));
        
        // Agregar filtro para solo procesar asesores sin comisiones
        if (asesoresSinComisiones.length > 0) {
          const idsAsesoresFaltantes = asesoresSinComisiones.map(a => a.id);
          whereClauseAsesor += ` AND a.id IN (${idsAsesoresFaltantes.join(',')})`;
          console.log('Filtro aplicado para asesores:', idsAsesoresFaltantes);
        } else {
          // Si no hay asesores faltantes, devolver mensaje informativo (no error)
          return res.status(200).json({
            success: true,
            message: 'Todos los asesores ya tienen comisiones calculadas',
            periodo: periodo,
            totalAsesoresConCreditos: asesoresConCreditos.length,
            totalAsesoresConComisiones: idsAsesoresConComisiones.length,
            asesoresConComisiones: nombresAsesoresConComisiones,
            accion: 'No hay nuevas comisiones para calcular',
            comisiones: [],
            asesoresConComision: 0,
            totalComisiones: 0
          });
        }
      }
    }

    // CONTINUAR CON EL CÁLCULO NORMAL...
    // Consulta para obtener comisiones por Bancos (sistema colombiano)
    const queryBancos = `
      SELECT 
        a.id as asesorId,
        a.nombre as asesorNombre,
        a.email as asesorEmail,
        a.cargo as asesorCargo,
        b.id as bancoid,
        NULL as financieraId,
        'Banco' as tipoEntidad,
        b.nombre as entidadNombre,
        b.comisionban as comisionPorMillon,
        COUNT(c.id) as creditosAprobados,
        COALESCE(SUM(c.monto), 0) as montoTotalGestionado,
        COALESCE(SUM(FLOOR(c.monto / 1000000) * b.comisionban), 0) as comisionBase
      FROM asesor a
      INNER JOIN Creditos c ON a.id = c.asesorId 
        AND c.fechaSolicitud BETWEEN :fechaInicio AND :fechaFin
        AND c.estado IN ('Aprobado', 'Desembolsado', 'Activo')
        AND c.bancoid IS NOT NULL
      INNER JOIN Bancos b ON c.bancoid = b.id
      WHERE 1=1 ${whereClauseAsesor}
      GROUP BY a.id, a.nombre, a.email, a.cargo, b.id, b.nombre, b.comisionban
      HAVING COUNT(c.id) > 0
    `;

    // Consulta para obtener comisiones por Financieras (sistema colombiano)
    const queryFinancieras = `
      SELECT 
        a.id as asesorId,
        a.nombre as asesorNombre,
        a.email as asesorEmail,
        a.cargo as asesorCargo,
        NULL as bancoid,
        f.id as financieraId,
        'Financiera' as tipoEntidad,
        f.nombre as entidadNombre,
        f.comisionfin as comisionPorMillon,
        COUNT(c.id) as creditosAprobados,
        COALESCE(SUM(c.monto), 0) as montoTotalGestionado,
        COALESCE(SUM(FLOOR(c.monto / 1000000) * f.comisionfin), 0) as comisionBase
      FROM asesor a
      INNER JOIN Creditos c ON a.id = c.asesorId 
        AND c.fechaSolicitud BETWEEN :fechaInicio AND :fechaFin
        AND c.estado IN ('Aprobado', 'Desembolsado', 'Activo')
        AND c.financieraId IS NOT NULL
      INNER JOIN Financieras f ON c.financieraId = f.id
      WHERE 1=1 ${whereClauseAsesor}
      GROUP BY a.id, a.nombre, a.email, a.cargo, f.id, f.nombre, f.comisionfin
      HAVING COUNT(c.id) > 0
    `;

    // Ejecutar ambas consultas
    const [estadisticasBancos, estadisticasFinancieras] = await Promise.all([
      db.sequelize.query(queryBancos, {
        replacements,
        type: QueryTypes.SELECT
      }),
      db.sequelize.query(queryFinancieras, {
        replacements,
        type: QueryTypes.SELECT
      })
    ]);

    // Combinar resultados
    const todasLasEstadisticas = [...estadisticasBancos, ...estadisticasFinancieras];

    // VALIDACIÓN: Si no hay datos para procesar
    if (todasLasEstadisticas.length === 0) {
      const mensajeNoEncontrados = asesorId 
        ? `No se encontraron créditos aprobados para el asesor seleccionado en el periodo ${periodo}`
        : `No se encontraron créditos aprobados para los asesores faltantes en el periodo ${periodo}`;
      
      return res.status(404).json({
        response: true,
        success: false,
        message: 'No se encontraron comisiones para calcular',
        detalles: {
          periodo: periodo,
          asesorId: asesorId || null,
          fechaInicio: fechaInicioStr,
          fechaFin: fechaFinStr,
          explicacion: mensajeNoEncontrados,
          sugerencias: [
            'Verifica que existan créditos con estado: Aprobado, Desembolsado o Activo',
            'Confirma que las fechas de solicitud estén dentro del periodo seleccionado',
            'Asegúrate de que los créditos tengan asignado un banco o financiera',
            asesorId ? 'Revisa que el asesor tenga créditos asociados en este periodo' : 'Revisa que los asesores faltantes tengan créditos asociados en este periodo'
          ]
        },
        criterios: {
          estadosValidos: ['Aprobado', 'Desembolsado', 'Activo'],
          requiere: 'Banco o Financiera asociada al crédito',
          sistema: 'Comisión por cada millón de pesos gestionado'
        }
      });
    }

    // Calcular comisiones usando el sistema colombiano
    const comisionesCalculadas = todasLasEstadisticas.map(stat => {
      const creditosAprobados = parseInt(stat.creditosAprobados) || 0;
      const montoGestionado = parseFloat(stat.montoTotalGestionado) || 0;
      const comisionBase = parseFloat(stat.comisionBase) || 0;
      const comisionPorMillon = parseFloat(stat.comisionPorMillon) || 0;
      
      // Calcular millones gestionados para mostrar en el detalle
      const millonesGestionados = Math.floor(montoGestionado / 1000000);
      
      // No agregar bonificaciones automáticas, solo la comisión base
      const bonificaciones = 0;
      const deducciones = 0;
      const comisionTotal = comisionBase;

      return {
        asesorId: stat.asesorId,
        bancoid: stat.bancoid,
        financieraId: stat.financieraId,
        tipoEntidad: stat.tipoEntidad,
        periodo: periodo,
        creditosAprobados: creditosAprobados,
        montoTotalGestionado: montoGestionado,
        comisionBase: comisionBase,
        bonificaciones: bonificaciones,
        deducciones: deducciones,
        comisionTotal: comisionTotal,
        estado: 'Pagado',
        fechaPago: new Date().toISOString(),
        metodoPago: 'Transferencia',
        observaciones: `Comisión calculada y pagada automáticamente para el periodo ${periodo}`,
        // Datos adicionales para el frontend
        asesorNombre: stat.asesorNombre,
        entidadNombre: stat.entidadNombre,
        millonesGestionados: millonesGestionados,
        comisionPorMillon: comisionPorMillon
      };
    });

    // Filtrar solo comisiones > 0
    const comisionesParaCrear = comisionesCalculadas.filter(c => c.comisionTotal > 0);
    
    if (comisionesParaCrear.length === 0) {
      const totalCreditos = comisionesCalculadas.reduce((sum, c) => sum + c.creditosAprobados, 0);
      const totalMonto = comisionesCalculadas.reduce((sum, c) => sum + c.montoTotalGestionado, 0);
      
      return res.status(404).json({
        success: false,
        message: 'No se generaron comisiones válidas',
        detalles: {
          periodo: periodo,
          asesorId: asesorId || null,
          creditosEncontrados: totalCreditos,
          montoTotalEncontrado: totalMonto,
          razonPrincipal: 'Los montos de los créditos son menores a $1,000,000 COP',
          sistemaComision: 'Solo se pagan comisiones por cada millón de pesos completo'
        }
      });
    }

    // Insertar en base de datos
    await Comision.bulkCreate(comisionesParaCrear.map(c => ({
      asesorId: c.asesorId,
      bancoid: c.bancoid,
      financieraId: c.financieraId,
      tipoEntidad: c.tipoEntidad,
      periodo: c.periodo,
      creditosAprobados: c.creditosAprobados,
      montoTotalGestionado: c.montoTotalGestionado,
      comisionBase: c.comisionBase,
      bonificaciones: c.bonificaciones,
      deducciones: c.deducciones,
      comisionTotal: c.comisionTotal,
      estado: c.estado,
      fechaPago: c.fechaPago,
      metodoPago: c.metodoPago,
      observaciones: c.observaciones
    })), {
      ignoreDuplicates: true // Evitar duplicados si ya existen
    }); 

    // GENERAR ARCHIVO TXT SOLO SI HAY COMISIONES VÁLIDAS
    const contenidoTXT = generarArchivoTXT(comisionesParaCrear, periodo, asesorId);
    
    // Crear directorio de reportes si no existe
    const reportesDir = path.join(__dirname, '../..', 'reportes');
    if (!fs.existsSync(reportesDir)) {
      fs.mkdirSync(reportesDir, { recursive: true });
    }
    
    // Nombre del archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = asesorId 
      ? `comision_asesor_${asesorId}_${periodo}_${timestamp}.txt`
      : `comisiones_completas_${periodo}_${timestamp}.txt`;
    const rutaArchivo = path.join(reportesDir, nombreArchivo);
    
    // Guardar archivo
    fs.writeFileSync(rutaArchivo, contenidoTXT, 'utf8');

    // MENSAJE MEJORADO - USAR VARIABLES DECLARADAS CORRECTAMENTE
    const mensaje = asesorId 
      ? `Comisión calculada para asesor específico en ${periodo}`
      : (asesoresSinComisiones && asesoresSinComisiones.length > 0)
        ? `Comisiones completadas para ${asesoresSinComisiones.length} asesores faltantes en ${periodo}`
        : `Comisiones calculadas para todos los asesores en ${periodo}`;

    // Formatear respuesta con detalles del cálculo colombiano
    const detalleRespuesta = comisionesParaCrear.map(c => ({
      asesor: c.asesorNombre,
      entidad: `${c.entidadNombre} (${c.tipoEntidad})`,
      creditos: c.creditosAprobados,
      montoTotal: `$${c.montoTotalGestionado.toLocaleString('es-CO')} COP`,
      millonesGestionados: c.millonesGestionados,
      comisionPorMillon: `$${c.comisionPorMillon.toLocaleString('es-CO')} COP`,
      calculoComision: `${c.millonesGestionados} millones × $${c.comisionPorMillon.toLocaleString('es-CO')}`,
      comisionTotal: `$${c.comisionTotal.toLocaleString('es-CO')} COP`,
      estado: 'Pagado ✅',
      fechaPago: new Date().toLocaleDateString('es-CO'),
      metodoPago: 'Auto'
    }));

    res.json({
      success: true,
      message: mensaje,
      periodo: periodo,
      asesorId: asesorId || null,
      asesoresConComision: comisionesParaCrear.length,
      totalComisiones: comisionesParaCrear.reduce((sum, c) => sum + c.comisionTotal, 0),
      sistemaCalculo: {
        descripcion: "Sistema colombiano: Comisión fija por cada millón de pesos",
        formula: "FLOOR(Monto ÷ 1,000,000) × Comisión_por_millón"
      },
      detalle: detalleRespuesta,
      comisiones: comisionesParaCrear,
      archivo: {
        generado: true,
        nombre: nombreArchivo,
        ruta: rutaArchivo,
        tamaño: fs.statSync(rutaArchivo).size,
        contenido: contenidoTXT
      }
    });

  } catch (error) {
    console.error('Error calculando comisiones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Función para forzar recálculo (elimina y recrea)
exports.recalcularComisionesPeriodo = async (req, res) => {
  try {
    const { periodo, asesorId } = req.body;
    
    if (!periodo) {
      return res.status(400).json({ message: 'El periodo es requerido (formato: YYYY-MM)' });
    }

    // Eliminar comisiones existentes del periodo (y asesor si se especifica)
    const whereDelete = { periodo: periodo };
    if (asesorId) whereDelete.asesorId = asesorId;

    const comisionesEliminadas = await Comision.destroy({ where: whereDelete });

    // Llamar al cálculo normal
    const resultadoCalculo = await exports.calcularComisionesPeriodo(req, res);
    
    // Si llegamos aquí, el cálculo fue exitoso
    return;

  } catch (error) {
    console.error('Error recalculando comisiones:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las comisiones con información detallada
exports.getAllComisiones = async (req, res) => {
  try {
    const { periodo, estado } = req.query;
    
    const whereClause = {};
    if (periodo) whereClause.periodo = periodo;
    if (estado) whereClause.estado = estado;

    const comisiones = await Comision.findAll({
      where: whereClause,
      include: [
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre', 'email', 'cargo', 'sucursal']
        },
        {
          model: db.Banco,
          as: 'banco',
          attributes: ['id', 'nombre', 'comisionban'],
          required: false
        },
        {
          model: db.Financiera,
          as: 'financiera',
          attributes: ['id', 'nombre', 'comisionfin'],
          required: false
        }
      ],
      order: [['periodo', 'DESC'], ['comisionTotal', 'DESC']]
    });

    res.json(comisiones);
  } catch (error) {
    console.error('Error obteniendo comisiones:', error);
    res.status(500).json({ message: error.message });
  }
};

// Marcar comisión como pagada (eliminar estado "Aprobado")
exports.updateComision = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fechaPago, metodoPago, numeroTransferencia, observaciones, deducciones, bonificaciones } = req.body;

    const comision = await Comision.findByPk(id);
    if (!comision) {
      return res.status(404).json({ message: 'Comisión no encontrada' });
    }

    // Recalcular total considerando bonificaciones y deducciones
    let comisionTotal = comision.comisionBase + (bonificaciones || 0) - (deducciones || 0);

    const updateData = {
      estado,
      observaciones,
      deducciones: deducciones || 0,
      bonificaciones: bonificaciones || 0,
      comisionTotal: comisionTotal
    };

    if (estado === 'Pagado') {
      updateData.fechaPago = fechaPago || new Date();
      updateData.metodoPago = metodoPago;
      updateData.numeroTransferencia = numeroTransferencia;
    }

    await comision.update(updateData);

    const comisionActualizada = await Comision.findByPk(id, {
      include: [
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre', 'email', 'cargo']
        },
        {
          model: db.Banco,
          as: 'banco',
          attributes: ['id', 'nombre', 'comisionban']
        },
        {
          model: db.Financiera,
          as: 'financiera',
          attributes: ['id', 'nombre', 'comisionfin']
        }
      ]
    });

    res.json(comisionActualizada);
  } catch (error) {
    console.error('Error actualizando comisión:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener resumen de comisiones por periodo
exports.getResumenComisiones = async (req, res) => {
  try {
    const resumen = await db.sequelize.query(`
      SELECT 
        periodo,
        COUNT(*) as totalComisiones,
        COUNT(DISTINCT asesorId) as totalAsesores,
        COALESCE(SUM(comisionTotal), 0) as totalMonto,
        COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'Pagado' THEN 1 END) as pagados,
        COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as rechazados,
        COUNT(CASE WHEN tipoEntidad = 'Banco' THEN 1 END) as comisionesBancos,
        COUNT(CASE WHEN tipoEntidad = 'Financiera' THEN 1 END) as comisionesFinancieras
      FROM Comisions 
      GROUP BY periodo 
      ORDER BY periodo DESC
      LIMIT 12
    `, { type: QueryTypes.SELECT });

    // Formatear los datos para el frontend
    const resumenFormateado = resumen.map(item => ({
      periodo: item.periodo,
      totalComisiones: parseInt(item.totalComisiones) || 0,
      totalAsesores: parseInt(item.totalAsesores) || 0,
      totalMonto: parseFloat(item.totalMonto) || 0,
      comisionTotal: parseFloat(item.totalMonto) || 0, // Alias para compatibilidad
      pendientes: parseInt(item.pendientes) || 0,
      pagados: parseInt(item.pagados) || 0,
      rechazados: parseInt(item.rechazados) || 0,
      comisionesBancos: parseInt(item.comisionesBancos) || 0,
      comisionesFinancieras: parseInt(item.comisionesFinancieras) || 0
    }));

    res.json(resumenFormateado);
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener comisiones por asesor
exports.getComisionesByAsesor = async (req, res) => {
  try {
    const { asesorId } = req.params;
    const { periodo, estado } = req.query;
    
    const whereClause = { asesorId };
    if (periodo) whereClause.periodo = periodo;
    if (estado) whereClause.estado = estado;

    const comisiones = await Comision.findAll({
      where: whereClause,
      include: [
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre', 'email', 'cargo']
        },
        {
          model: db.Banco,
          as: 'banco',
          attributes: ['id', 'nombre', 'comisionban'],
          required: false
        },
        {
          model: db.Financiera,
          as: 'financiera',
          attributes: ['id', 'nombre', 'comisionfin'],
          required: false
        }
      ],
      order: [['periodo', 'DESC']]
    });

    res.json(comisiones);
  } catch (error) {
    console.error('Error obteniendo comisiones por asesor:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener comisiones por periodo
exports.getComisionesByPeriodo = async (req, res) => {
  try {
    const { periodo } = req.params;
    const { estado } = req.query;
    
    const whereClause = { periodo };
    if (estado) whereClause.estado = estado;

    const comisiones = await Comision.findAll({
      where: whereClause,
      include: [
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre', 'email', 'cargo']
        },
        {
          model: db.Banco,
          as: 'banco',
          attributes: ['id', 'nombre', 'comisionban'],
          required: false
        },
        {
          model: db.Financiera,
          as: 'financiera',
          attributes: ['id', 'nombre', 'comisionfin'],
          required: false
        }
      ],
      order: [['comisionTotal', 'DESC']]
    });

    res.json(comisiones);
  } catch (error) {
    console.error('Error obteniendo comisiones por periodo:', error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar comisión
exports.deleteComision = async (req, res) => {
  try {
    const { id } = req.params;

    const comision = await Comision.findByPk(id);
    if (!comision) {
      return res.status(404).json({ message: 'Comisión no encontrada' });
    }

    // Solo se pueden eliminar comisiones pendientes
    if (comision.estado !== 'Pendiente') {
      return res.status(400).json({ 
        message: 'Solo se pueden eliminar comisiones en estado Pendiente' 
      });
    }

    await comision.destroy();
    res.json({ message: 'Comisión eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando comisión:', error);
    res.status(500).json({ message: error.message });
  }
};