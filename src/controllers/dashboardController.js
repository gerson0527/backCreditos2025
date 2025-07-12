const db = require('../../models');
const { Op } = require('sequelize');

exports.getCreditosProcesos = async (req, res) => {
    try {   
        const results = await db.sequelize.query(`
          SELECT 
            actual.total AS creditos_en_proceso,
            CONCAT(
                IF(actual.total > anterior.total, '+', ''),
                (actual.total - anterior.total),' semana pasada'
            ) AS variacion_semanal
        FROM 
            (
                SELECT COUNT(*) AS total
                FROM Creditos
                WHERE estado IN ('En Revisión', 'Pendiente')
                AND fechaSolicitud >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            ) AS actual,
            (
                SELECT COUNT(*) AS total
                FROM Creditos
                WHERE estado IN ('En Revisión', 'Pendiente')
                AND fechaSolicitud BETWEEN 
                    DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) 
                    AND DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            ) AS anterior;
        `);
    
        res.json(results[0][0]);
    } catch (error) {
        console.error('Error en getCreditosProcesos:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMontoSolicitudes = async (req, res) => {
    try {
        const results = await db.sequelize.query(`
            SELECT 
                CONCAT('$', FORMAT(monto_actual, 1)) AS monto_en_solicitudes,
                CONCAT(
                    IF(monto_actual > monto_anterior, '+', ''),
                    ROUND(((monto_actual - monto_anterior) / NULLIF(monto_anterior, 0)) * 100, 0),
                    '% este mes'
                ) AS variacion_mensual
            FROM (
                SELECT
                    SUM(CASE 
                        WHEN estado IN ('En Revisión', 'Pendiente') 
                        AND MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) 
                        THEN monto ELSE 0 
                    END) AS monto_actual,
                    SUM(CASE 
                        WHEN estado IN ('En Revisión', 'Pendiente') 
                        AND MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) - 1 
                        THEN monto ELSE 0 
                    END) AS monto_anterior
                FROM Creditos
                WHERE YEAR(fechaSolicitud) = YEAR(CURRENT_DATE)
                AND MONTH(fechaSolicitud) BETWEEN MONTH(CURRENT_DATE) - 1 AND MONTH(CURRENT_DATE)
            ) AS montos
        `);

        res.json(results[0][0]);
    } catch (error) {
        console.error('Error en getMontoSolicitudes:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getTasaAprobacion = async (req, res) => {
    try {
        const results = await db.sequelize.query(`
            SELECT
                ROUND(tasa_actual * 100, 0) AS tasa_aprobacion,
                CONCAT(
                    IF(tasa_actual > tasa_anterior, '+', ''),
                    ROUND((tasa_actual - tasa_anterior) * 100, 0),
                    '% vs mes anterior'
                ) AS variacion_mensual
            FROM (
                SELECT
                    COUNT(CASE WHEN estado = 'Aprobado' AND MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) THEN 1 END) /
                    NULLIF(COUNT(CASE WHEN estado IN ('Aprobado', 'Rechazado') AND MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) THEN 1 END), 0) AS tasa_actual,
                    COUNT(CASE WHEN estado = 'Aprobado' AND MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) - 1 THEN 1 END) /
                    NULLIF(COUNT(CASE WHEN estado IN ('Aprobado', 'Rechazado') AND MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) - 1 THEN 1 END), 0) AS tasa_anterior
                FROM
                    Creditos
                WHERE
                    YEAR(fechaSolicitud) = YEAR(CURRENT_DATE)
                    AND MONTH(fechaSolicitud) BETWEEN MONTH(CURRENT_DATE) - 1 AND MONTH(CURRENT_DATE)
            ) AS tasas
        `);

        res.json(results[0][0]);
    } catch (error) {
        console.error('Error en getTasaAprobacion:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getTiempoPromedio = async (req, res) => {
    try {
        const results = await db.sequelize.query(`
            SELECT
                ROUND(tiempo_actual, 1) AS tiempo_promedio_dias,
                CONCAT(
                    IF(tiempo_actual < tiempo_anterior, '-', '+'),
                    ROUND(ABS(tiempo_actual - tiempo_anterior), 1),
                    ' días vs mes anterior'
                ) AS variacion_mensual
            FROM (
                SELECT
                    AVG(
                        CASE
                            WHEN MONTH(fechaSolicitud) = MONTH(CURRENT_DATE)
                            THEN TIMESTAMPDIFF(DAY, fechaSolicitud, fechaAprobacion)
                            ELSE NULL
                        END
                    ) AS tiempo_actual,
                    AVG(
                        CASE
                            WHEN MONTH(fechaSolicitud) = MONTH(CURRENT_DATE) - 1
                            THEN TIMESTAMPDIFF(DAY, fechaSolicitud, fechaAprobacion)
                            ELSE NULL
                        END
                    ) AS tiempo_anterior
                FROM
                    Creditos
                WHERE
                    YEAR(fechaSolicitud) = YEAR(CURRENT_DATE)
                    AND MONTH(fechaSolicitud) BETWEEN MONTH(CURRENT_DATE) - 1 AND MONTH(CURRENT_DATE)
                    AND estado = 'Aprobado'
                    AND fechaAprobacion IS NOT NULL
            ) AS tiempos
        `);

        res.json(results[0][0]);
    } catch (error) {
        console.error('Error en getTiempoPromedio:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUltimasSolicitudes = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const results = await db.sequelize.query(`
            SELECT 
                c.id,
                c.monto,
                c.estado,
                c.tipo,
                c.fechaSolicitud,
                c.fechaAprobacion,
                c.fechaRechazo,
                CONCAT(cl.nombre, ' ', cl.apellido) AS nombreCliente,
                cl.dni AS cedulaCliente,
                CASE 
                    WHEN c.bancoid IS NOT NULL THEN b.nombre
                    WHEN c.financieraId IS NOT NULL THEN f.nombre
                    ELSE 'Sin asignar'
                END AS entidadFinanciera,
                CASE 
                    WHEN c.estado = 'Pendiente' THEN 'warning'
                    WHEN c.estado = 'En Revisión' THEN 'info'
                    WHEN c.estado = 'Aprobado' THEN 'success'
                    WHEN c.estado = 'Rechazado' THEN 'warning'
                    ELSE 'info'
                END AS tipoActividad,
                CASE 
                    WHEN c.estado = 'Pendiente' THEN 'Documentación Pendiente'
                    WHEN c.estado = 'En Revisión' THEN 'En Proceso de Revisión'
                    WHEN c.estado = 'Aprobado' THEN 'Crédito Aprobado'
                    WHEN c.estado = 'Rechazado' THEN 'Solicitud Rechazada'
                    ELSE 'Estado Desconocido'
                END AS tituloActividad,
                TIMESTAMPDIFF(MINUTE, c.updatedAt, NOW()) AS minutosTranscurridos
            FROM Creditos c
            INNER JOIN clientes cl ON c.clienteId = cl.id
            LEFT JOIN bancos b ON c.bancoid = b.id
            LEFT JOIN financieras f ON c.financieraId = f.id
            ORDER BY c.updatedAt DESC
            LIMIT ?
        `, {
            replacements: [parseInt(limit)],
            type: db.sequelize.QueryTypes.SELECT
        });

        // Formatear los resultados para el frontend
        const solicitudesFormateadas = results.map(solicitud => {
            let tiempoTranscurrido;
            const minutos = solicitud.minutosTranscurridos;
            
            if (minutos < 60) {
                tiempoTranscurrido = `Hace ${minutos} min`;
            } else if (minutos < 1440) { // menos de 24 horas
                const horas = Math.floor(minutos / 60);
                tiempoTranscurrido = `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
            } else {
                const dias = Math.floor(minutos / 1440);
                tiempoTranscurrido = `Hace ${dias} día${dias > 1 ? 's' : ''}`;
            }

            return {
                id: solicitud.id,
                type: solicitud.tipoActividad,
                title: solicitud.tituloActividad,
                description: `${solicitud.tipo} - $${Number(solicitud.monto).toLocaleString()} - Cliente: ${solicitud.nombreCliente}`,
                time: tiempoTranscurrido,
                entidad: solicitud.entidadFinanciera,
                estado: solicitud.estado,
                monto: solicitud.monto,
                cliente: {
                    nombre: solicitud.nombreCliente,
                    cedula: solicitud.cedulaCliente
                },
                fechas: {
                    solicitud: solicitud.fechaSolicitud,
                    aprobacion: solicitud.fechaAprobacion,
                    rechazo: solicitud.fechaRechazo
                }
            };
        });

        res.json(solicitudesFormateadas);
    } catch (error) {
        console.error('Error en getUltimasSolicitudes:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDistribucionTipos = async (req, res) => {
    try {
        const results = await db.sequelize.query(`
            SELECT 
            tipo,
            cantidad,
            ROUND(cantidad * 100.0 / total, 1) as porcentaje
            FROM (
            SELECT 
                tipo,
                COUNT(*) as cantidad,
                (SELECT COUNT(*) 
                    FROM creditos 
                    WHERE fechaSolicitud >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
                ) as total
            FROM Creditos
            WHERE fechaSolicitud >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
            GROUP BY tipo
            ) as subquery
            ORDER BY cantidad DESC;
        `);

        res.json(results[0]);
    } catch (error) {
        console.error('Error en getDistribucionTipos:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDistribucionEstados = async (req, res) => {
    try {
        const results = await db.sequelize.query(`
            SELECT 
            estado,
            cantidad,
            ROUND(cantidad * 100.0 / total, 1) AS porcentaje
            FROM (
            SELECT 
                estado,
                COUNT(*) AS cantidad,
                (
                    SELECT COUNT(*)
                    FROM creditos
                    WHERE fechaSolicitud >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
                ) AS total
            FROM Creditos
            WHERE fechaSolicitud >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
            GROUP BY estado
            ) AS subquery
            ORDER BY cantidad DESC;

        `);

        res.json(results[0]);
    } catch (error) {
        console.error('Error en getDistribucionEstados:', error);
        res.status(500).json({ message: error.message });
    }
};
  