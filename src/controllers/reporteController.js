const db = require('../../models');
const { Op } = require('sequelize');
const Credito = db.Credito;
const Asesor = db.Asesor;
const Banco = db.Banco;
const Cliente = db.Cliente;
const Financiera = db.Financiera;
 
// 🎯 IMPORTAR LIBRERÍAS PARA EXPORTACIÓN
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.getReportePeriodo = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    // Convertir las fechas a objetos Date
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    
    const creditos = await Credito.findAll({
      where: {
        createdAt: {
          [Op.between]: [fechaInicioObj, fechaFinObj]
        }
      }
    });

    const creditosAprobados = creditos.filter(c => c.estado === 'Aprobado').length;
    const creditosRechazados = creditos.filter(c => c.estado === 'Rechazado').length;
    const creditosPendientes = creditos.filter(c => c.estado === 'Pendiente').length;
    const montoTotal = creditos.reduce((sum, c) => sum + (c.estado === 'Aprobado' ? parseFloat(c.monto) : 0), 0);    
    const tasaAprobacion = (creditosAprobados / creditos.length) * 100 || 0;
    const comisionesTotal = creditos.reduce((sum, c) => sum + (c.estado === 'Aprobado' ? c.monto * 0.02 : 0), 0);
    res.json({
      creditosAprobados,
      creditosRechazados,
      creditosPendientes,
      montoTotal,
      tasaAprobacion,
      comisionesTotal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRankingAsesores = async (req, res) => {
  try {
    // Ejecutar la consulta raw SQL usando Sequelize
    const results = await db.sequelize.query(`
      SELECT 
    @posicion := @posicion + 1 AS Posicion,
    subquery.nombre AS Asesor,
    subquery.total_creditos AS Creditos,
    CONCAT('$', FORMAT(subquery.monto_total, 0), 'K') AS 'Monto Gestionado',
    CONCAT('$', FORMAT(subquery.total_creditos * 1000, 0), 'K') AS Comisiones,
    CONCAT(
        REPEAT('█', GREATEST(1, FLOOR((subquery.rendimiento)/20))), 
        ' ', 
        ROUND(subquery.rendimiento, 0), '%'
    ) AS Rendimiento
FROM 
    (SELECT @posicion := 0, @max_monto := (
        SELECT COALESCE(MAX(monto_total), 1) FROM (
            SELECT SUM(c.monto) AS monto_total
            FROM Creditos c
            WHERE c.estado = 'Aprobado'
            GROUP BY c.asesorId
        ) AS temp_montos
    )) AS init,
    (
        SELECT 
            a.id,
            a.nombre,
            COUNT(c.id) AS total_creditos,
            COALESCE(SUM(c.monto), 0) AS monto_total,
            -- Fórmula corregida con validación de montos
            CASE 
                WHEN @max_monto <= 0 THEN 0
                WHEN SUM(c.monto) IS NULL THEN 0
                ELSE (SUM(c.monto)/@max_monto) * 100
            END AS rendimiento
        FROM 
            Asesor a
        LEFT JOIN 
            Creditos c ON a.id = c.asesorId AND c.estado = 'Aprobado'
        GROUP BY 
            a.id, a.nombre
        ORDER BY 
            monto_total DESC
    ) AS subquery;
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    console.error('Error en getRankingAsesores:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCreditosMeses = async (req, res) => {
  try {
    console.log(req.query);
    const { year } = req.query; // Obtener el ano desde los query params

    if (!year || isNaN(year)) {
      return res.status(400).json({ message: 'Debe proporcionar un año válido' });
    }

    const results = await db.sequelize.query(`
      SELECT 
          CASE MONTH(fechaSolicitud)
              WHEN 1 THEN 'Enero'
              WHEN 2 THEN 'Febrero'
              WHEN 3 THEN 'Marzo'
              WHEN 4 THEN 'Abril'
              WHEN 5 THEN 'Mayo'
              WHEN 6 THEN 'Junio'
              WHEN 7 THEN 'Julio'
              WHEN 8 THEN 'Agosto'
              WHEN 9 THEN 'Septiembre'
              WHEN 10 THEN 'Octubre'
              WHEN 11 THEN 'Noviembre'
              WHEN 12 THEN 'Diciembre'
          END AS mes,
          MONTH(fechaSolicitud) AS mes_num,
          SUM(CASE WHEN estado = 'Aprobado' THEN 1 ELSE 0 END) AS aprobados,
          SUM(CASE WHEN estado = 'Rechazado' THEN 1 ELSE 0 END) AS rechazados,
          SUM(CASE WHEN estado IN ('En Revisión', 'Pendiente') THEN 1 ELSE 0 END) AS pendientes
      FROM Creditos
      WHERE YEAR(createdAt) = :year
      GROUP BY mes, mes_num
      ORDER BY mes_num;
    `, {
      replacements: { year: parseInt(year) },
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    console.error('Error en getCreditosMeses:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getReporteBancos = async (req, res) => {
  try {
    const bancos = await Banco.findAll({
      include: [{
        model: Credito,
        as: 'creditos',
        required: false
      }]
    });

    const totalCreditos = await Credito.count({ where: { estado: 'Aprobado' } }) || 1;
    const montoTotalSistema = await Credito.sum('monto', { where: { estado: 'Aprobado' } }) || 0;

    const reporteBancos = bancos.map(banco => {
      const creditosActivos = banco.creditos?.filter(c => c.estado === 'Aprobado').length || 0;
      const montoTotal = banco.creditos?.reduce((sum, c) => sum + (c.estado === 'Aprobado' ? parseFloat(c.monto || 0) : 0), 0) || 0;
      
      return {
        id: banco.id,
        nombre: banco.nombre,
        creditosActivos,
        montoTotal,
        participacion: (creditosActivos / totalCreditos) * 100 || 0
      };
    });

    res.json(reporteBancos);
  } catch (error) {
    console.error('Error en getReporteBancos:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getReporteMorosidad = async (req, res) => {
  try {
    const creditos = await Credito.findAll({
      where: {
        estado: 'Aprobado'
      }
    });

    const rangos = [
      { min: 0, max: 30, label: '0-30 días' },
      { min: 31, max: 60, label: '31-60 días' },
      { min: 61, max: 90, label: '61-90 días' },
      { min: 91, max: Infinity, label: '90+ días' }
    ];

    const reporteMorosidad = rangos.map(rango => {
      const creditosEnRango = creditos.filter(credito => {
        const diasAtraso = Math.floor((new Date() - new Date(credito.fechaPago)) / (1000 * 60 * 60 * 24));
        return diasAtraso >= rango.min && diasAtraso <= rango.max;
      });

      const monto = creditosEnRango.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
      const porcentaje = (creditosEnRango.length / (creditos.length || 1)) * 100 || 0;

      return {
        rango: rango.label,
        cantidad: creditosEnRango.length,
        monto,
        porcentaje
      };
    });

    res.json(reporteMorosidad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🎯 NUEVO: EXPORTAR A EXCEL
exports.exportarExcel = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;
    
    console.log('Exportando Excel con fechas:', { fechaInicio, fechaFin });

    // 🎯 OBTENER DATOS PARA EL REPORTE
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    
    // Datos del período
    const creditos = await Credito.findAll({
      where: {
        createdAt: {
          [Op.between]: [fechaInicioObj, fechaFinObj]
        }
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'apellido', 'dni']
        },
        {
          model: Banco,
          as: 'banco',
          attributes: ['nombre']
        },
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['nombre']
        }
      ]
    });

    // Resumen de bancos
    const resumenBancos = await db.sequelize.query(`
      SELECT 
        b.nombre AS banco, 
        COUNT(c.id) AS total_creditos, 
        SUM(c.monto) AS total_monto 
      FROM Creditos c 
      LEFT JOIN bancos b ON b.id = c.bancoId 
      WHERE c.createdAt BETWEEN :fechaInicio AND :fechaFin
      GROUP BY b.nombre 
      ORDER BY total_monto DESC;
    `, {
      replacements: { fechaInicio: fechaInicioObj, fechaFin: fechaFinObj },
      type: db.sequelize.QueryTypes.SELECT
    });

    // Ranking de asesores
    const rankingAsesores = await db.sequelize.query(`
      SELECT 
        a.nombre AS asesor,
        COUNT(c.id) AS total_creditos,
        COALESCE(SUM(c.monto), 0) AS monto_total,
        ROUND(AVG(CASE WHEN c.estado = 'Aprobado' THEN 100 ELSE 0 END), 1) AS tasa_aprobacion
      FROM Asesor a
      LEFT JOIN Creditos c ON a.id = c.asesorId 
        AND c.createdAt BETWEEN :fechaInicio AND :fechaFin
      GROUP BY a.id, a.nombre
      ORDER BY monto_total DESC;
    `, {
      replacements: { fechaInicio: fechaInicioObj, fechaFin: fechaFinObj },
      type: db.sequelize.QueryTypes.SELECT
    });

    // 🎯 CREAR WORKBOOK DE EXCEL
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Créditos';
    workbook.created = new Date();

    // 🎯 HOJA 1: RESUMEN EJECUTIVO
    const resumenSheet = workbook.addWorksheet('Resumen Ejecutivo');
    
    // Título
    resumenSheet.addRow(['REPORTE DE CRÉDITOS - RESUMEN EJECUTIVO']);
    resumenSheet.addRow([`Período: ${fechaInicioObj.toLocaleDateString('es-ES')} - ${fechaFinObj.toLocaleDateString('es-ES')}`]);
    resumenSheet.addRow(['Generado:', new Date().toLocaleString('es-ES')]);
    resumenSheet.addRow([]);

    // Métricas principales
    const creditosAprobados = creditos.filter(c => c.estado === 'Aprobado').length;
    const creditosRechazados = creditos.filter(c => c.estado === 'Rechazado').length;
    const creditosPendientes = creditos.filter(c => ['En Revisión', 'Pendiente'].includes(c.estado)).length;
    const montoTotal = creditos.reduce((sum, c) => sum + (c.estado === 'Aprobado' ? parseFloat(c.monto) : 0), 0);
    const tasaAprobacion = (creditosAprobados / (creditos.length || 1)) * 100;

    resumenSheet.addRow(['MÉTRICAS PRINCIPALES']);
    resumenSheet.addRow(['Total de Créditos:', creditos.length]);
    resumenSheet.addRow(['Créditos Aprobados:', creditosAprobados]);
    resumenSheet.addRow(['Créditos Rechazados:', creditosRechazados]);
    resumenSheet.addRow(['Créditos Pendientes:', creditosPendientes]);
    resumenSheet.addRow(['Monto Total Aprobado:', `$${montoTotal.toLocaleString('es-CO')}`]);
    resumenSheet.addRow(['Tasa de Aprobación:', `${tasaAprobacion.toFixed(1)}%`]);

    // Estilo del título
    resumenSheet.getRow(1).font = { bold: true, size: 16 };
    resumenSheet.getRow(5).font = { bold: true, color: { argb: 'FF0066CC' } };

    // 🎯 HOJA 2: DETALLE DE CRÉDITOS
    const detalleSheet = workbook.addWorksheet('Detalle de Créditos');
    
    // Headers
    detalleSheet.addRow([
      'ID', 'Cliente', 'DNI', 'Monto', 'Estado', 'Banco', 'Asesor', 
      'Fecha Solicitud', 'Fecha Aprobación', 'Tipo', 'Tasa'
    ]);

    // Datos
    creditos.forEach(credito => {
      detalleSheet.addRow([
        credito.id,
        credito.cliente ? `${credito.cliente.nombre} ${credito.cliente.apellido}` : 'N/A',
        credito.cliente?.dni || 'N/A',
        credito.monto,
        credito.estado,
        credito.banco?.nombre || 'N/A',
        credito.asesor?.nombre || 'N/A',
        credito.fechaSolicitud ? new Date(credito.fechaSolicitud).toLocaleDateString('es-ES') : 'N/A',
        credito.fechaAprobacion ? new Date(credito.fechaAprobacion).toLocaleDateString('es-ES') : 'N/A',
        credito.tipo || 'N/A',
        credito.tasa ? `${credito.tasa}%` : 'N/A'
      ]);
    });

    // Estilo de headers
    const headerRow = detalleSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };

    // 🎯 HOJA 3: RESUMEN POR BANCOS
    const bancosSheet = workbook.addWorksheet('Resumen por Bancos');
    
    bancosSheet.addRow(['RESUMEN POR BANCOS']);
    bancosSheet.addRow([]);
    bancosSheet.addRow(['Banco', 'Total Créditos', 'Monto Total', 'Participación %']);
    
    const montoTotalBancos = resumenBancos.reduce((sum, b) => sum + parseFloat(b.total_monto || 0), 0);
    
    resumenBancos.forEach(banco => {
      const participacion = ((parseFloat(banco.total_monto || 0) / montoTotalBancos) * 100).toFixed(1);
      bancosSheet.addRow([
        banco.banco || 'Sin Banco',
        banco.total_creditos,
        `$${parseFloat(banco.total_monto || 0).toLocaleString('es-CO')}`,
        `${participacion}%`
      ]);
    });

    bancosSheet.getRow(1).font = { bold: true, size: 14 };
    bancosSheet.getRow(3).font = { bold: true };

    // 🎯 HOJA 4: RANKING DE ASESORES
    const asesoresSheet = workbook.addWorksheet('Ranking Asesores');
    
    asesoresSheet.addRow(['RANKING DE ASESORES']);
    asesoresSheet.addRow([]);
    asesoresSheet.addRow(['Posición', 'Asesor', 'Créditos', 'Monto Total', 'Tasa Aprobación']);
    
    rankingAsesores.forEach((asesor, index) => {
      asesoresSheet.addRow([
        index + 1,
        asesor.asesor,
        asesor.total_creditos,
        `$${parseFloat(asesor.monto_total || 0).toLocaleString('es-CO')}`,
        `${asesor.tasa_aprobacion}%`
      ]);
    });

    asesoresSheet.getRow(1).font = { bold: true, size: 14 };
    asesoresSheet.getRow(3).font = { bold: true };

    // 🎯 CONFIGURAR COLUMNAS
    [resumenSheet, detalleSheet, bancosSheet, asesoresSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = 15;
      });
    });

    // 🎯 GENERAR Y ENVIAR EL ARCHIVO
    const fileName = `reporte_creditos_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({ message: 'Error al generar el archivo Excel', error: error.message });
  }
};

// 🎯 NUEVO: EXPORTAR A PDF
exports.exportarPDF = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;
    
    console.log('Exportando PDF con fechas:', { fechaInicio, fechaFin });

    // 🎯 OBTENER DATOS PARA EL REPORTE
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    
    const creditos = await Credito.findAll({
      where: {
        createdAt: {
          [Op.between]: [fechaInicioObj, fechaFinObj]
        }
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'apellido', 'dni']
        },
        {
          model: Banco,
          as: 'banco',
          attributes: ['nombre']
        },
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['nombre']
        }
      ],
      limit: 50 // Limitar para PDF
    });

    // Métricas
    const creditosAprobados = creditos.filter(c => c.estado === 'Aprobado').length;
    const creditosRechazados = creditos.filter(c => c.estado === 'Rechazado').length;
    const creditosPendientes = creditos.filter(c => ['En Revisión', 'Pendiente'].includes(c.estado)).length;
    const montoTotal = creditos.reduce((sum, c) => sum + (c.estado === 'Aprobado' ? parseFloat(c.monto) : 0), 0);
    const tasaAprobacion = (creditosAprobados / (creditos.length || 1)) * 100;

    // 🎯 CREAR DOCUMENTO PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Headers de respuesta
    const fileName = `reporte_creditos_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    doc.pipe(res);

    // 🎯 TÍTULO Y HEADER
    doc.fontSize(20).font('Helvetica-Bold').text('REPORTE DE CRÉDITOS', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica')
       .text(`Período: ${fechaInicioObj.toLocaleDateString('es-ES')} - ${fechaFinObj.toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
    doc.moveDown(1);

    // 🎯 RESUMEN EJECUTIVO
    doc.fontSize(16).font('Helvetica-Bold').text('RESUMEN EJECUTIVO');
    doc.moveDown(0.5);

    const metricas = [
      { label: 'Total de Créditos:', valor: creditos.length.toString() },
      { label: 'Créditos Aprobados:', valor: creditosAprobados.toString() },
      { label: 'Créditos Rechazados:', valor: creditosRechazados.toString() },
      { label: 'Créditos Pendientes:', valor: creditosPendientes.toString() },
      { label: 'Monto Total Aprobado:', valor: `$${montoTotal.toLocaleString('es-CO')}` },
      { label: 'Tasa de Aprobación:', valor: `${tasaAprobacion.toFixed(1)}%` }
    ];

    metricas.forEach(metrica => {
      doc.fontSize(11).font('Helvetica-Bold').text(metrica.label, { continued: true });
      doc.font('Helvetica').text(` ${metrica.valor}`);
    });

    doc.moveDown(1);

    // 🎯 TABLA DE CRÉDITOS (Primeros 20)
    doc.fontSize(14).font('Helvetica-Bold').text('DETALLE DE CRÉDITOS (Primeros 20)');
    doc.moveDown(0.5);

    // Headers de tabla
    const tableTop = doc.y;
    const tableHeaders = ['ID', 'Cliente', 'Monto', 'Estado', 'Banco'];
    const columnWidths = [40, 120, 80, 80, 100];
    let currentX = 50;

    // Dibujar headers
    tableHeaders.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, tableTop, { width: columnWidths[i] });
      currentX += columnWidths[i];
    });

    // Línea separadora
    doc.moveTo(50, tableTop + 15).lineTo(450, tableTop + 15).stroke();

    // Datos de la tabla
    let currentY = tableTop + 25;
    creditos.slice(0, 20).forEach((credito, index) => {
      if (currentY > 700) { // Nueva página si es necesario
        doc.addPage();
        currentY = 50;
      }

      currentX = 50;
      const rowData = [
        credito.id.toString(),
        credito.cliente ? `${credito.cliente.nombre} ${credito.cliente.apellido}`.substring(0, 18) : 'N/A',
        `$${parseFloat(credito.monto || 0).toLocaleString('es-CO')}`.substring(0, 12),
        credito.estado.substring(0, 12),
        (credito.banco?.nombre || 'N/A').substring(0, 15)
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(9).font('Helvetica').text(data, currentX, currentY, { width: columnWidths[i] });
        currentX += columnWidths[i];
      });

      currentY += 20;
    });

    // 🎯 GRÁFICO SIMPLE DE ESTADOS (Texto)
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('DISTRIBUCIÓN POR ESTADOS');
    doc.moveDown(0.5);

    const estados = [
      { estado: 'Aprobados', cantidad: creditosAprobados, color: '🟢' },
      { estado: 'Rechazados', cantidad: creditosRechazados, color: '🔴' },
      { estado: 'Pendientes', cantidad: creditosPendientes, color: '🟡' }
    ];

    estados.forEach(item => {
      const porcentaje = ((item.cantidad / (creditos.length || 1)) * 100).toFixed(1);
      doc.fontSize(12).font('Helvetica')
         .text(`${item.color} ${item.estado}: ${item.cantidad} (${porcentaje}%)`);
      doc.moveDown(0.3);
    });

    // 🎯 FOOTER
    doc.fontSize(8).font('Helvetica').text(
      'Este reporte fue generado automáticamente por el Sistema de Gestión de Créditos',
      50, doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error('Error al exportar PDF:', error);
    res.status(500).json({ message: 'Error al generar el archivo PDF', error: error.message });
  }
};

exports.getResumenPorBanco = async (req, res) => {
  try {
    const results = await db.sequelize.query(`
      SELECT 
        b.nombre AS banco, 
        COUNT(c.id) AS total_creditos, 
        SUM(c.monto) AS total_monto 
      FROM Creditos c 
      LEFT JOIN Bancos b ON b.id = c.bancoId 
      GROUP BY b.nombre 
      ORDER BY total_monto DESC limit 5;
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    console.error('Error en getResumenPorBanco:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getResumenPorFinanciera = async (req, res) => {
  try {
    const results = await db.sequelize.query(`
      SELECT 
        f.nombre AS banco, 
        COUNT(c.id) AS total_creditos, 
        SUM(c.monto) AS total_monto 
      FROM Creditos c 
      LEFT JOIN Financieras f ON f.id = c.financieraId 
      GROUP BY f.nombre 
      ORDER BY total_monto DESC limit 5;
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    console.error('Error en getResumenPorFinanciera:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getResumenPorEstado = async (req, res) => {
  try {
    const results = await db.sequelize.query(`
      SELECT 
        estado, 
        COUNT(*) AS cantidad, 
        ROUND((COUNT(*) / total.total_creditos) * 100, 1) AS porcentaje 
      FROM Creditos 
      JOIN ( 
        SELECT COUNT(*) AS total_creditos FROM Creditos 
      ) AS total ON TRUE 
      GROUP BY estado, total.total_creditos  
      ORDER BY cantidad DESC limit 5;
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    console.error('Error en getResumenPorEstado:', error);
    res.status(500).json({ message: error.message });
  }
};