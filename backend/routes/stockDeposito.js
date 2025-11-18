import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📌 1. Obtener el stock total en depósito (Vista principal)
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                 p.id AS producto_id,
                 p.nombre AS producto_nombre,
                 p.codigo,
                 p.kilos,
                 p.stock AS stock_total, -- Stock TOTAL del sistema
                 c.nombre AS categoria_nombre,
                 COALESCE(SUM(sdd.cantidad_actual), 0) AS stock_en_deposito,
                 (p.stock - COALESCE(SUM(sdd.cantidad_actual), 0)) AS stock_en_tienda
             FROM productos p
                      LEFT JOIN stock_deposito_detalle sdd ON sdd.producto_id = p.id AND sdd.cantidad_actual > 0
                      LEFT JOIN categorias c ON p.categoria_id = c.id
             GROUP BY p.id, p.nombre, p.codigo, p.kilos, p.stock, c.nombre
             HAVING COALESCE(SUM(sdd.cantidad_actual), 0) > 0 -- Solo mostrar productos con stock en depósito
             ORDER BY p.nombre ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener stock en depósito:", error);
        res.status(500).json({ error: "Error al obtener stock en depósito" });
    }
});

// 📌 2. Obtener el detalle de lotes por producto (para saber 'la fecha desde que lo tengo')
router.get("/lotes/:productoId", async (req, res) => {
    const { productoId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, cantidad_actual, fecha_ingreso
             FROM stock_deposito_detalle
             WHERE producto_id = $1 AND cantidad_actual > 0
             ORDER BY fecha_ingreso ASC`, // FIFO
            [productoId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener lotes de depósito:", error);
        res.status(500).json({ error: "Error al obtener lotes de depósito" });
    }
});

// 📌 3. Registrar la transferencia de Depósito a Tienda (Salida de Mercadería)
// RECIBE: { cantidad_a_mover, producto_id }
router.post("/transferir", async (req, res) => {
    const { producto_id, cantidad_a_mover } = req.body;
    const cantidad = parseInt(cantidad_a_mover);

    if (!producto_id || cantidad <= 0 || isNaN(cantidad)) {
        return res.status(400).json({ error: "Datos de transferencia inválidos" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Verificar stock suficiente en depósito
        const checkStock = await client.query(
            `SELECT COALESCE(SUM(cantidad_actual), 0) AS stock_deposito_actual
             FROM stock_deposito_detalle
             WHERE producto_id = $1`,
            [producto_id]
        );

        const stockActualDepo = parseInt(checkStock.rows[0].stock_deposito_actual || 0);

        if (cantidad > stockActualDepo) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: `Stock insuficiente en depósito. Solo hay ${stockActualDepo} unidades.` });
        }

        let cantidadPendiente = cantidad;

        // 2. Aplicar FIFO: Consumir lotes más antiguos
        // Bloquear filas para evitar concurrencia
        const lotesResult = await client.query(
            `SELECT id, cantidad_actual
             FROM stock_deposito_detalle
             WHERE producto_id = $1 AND cantidad_actual > 0
             ORDER BY fecha_ingreso ASC
                 FOR UPDATE`,
            [producto_id]
        );

        for (const lote of lotesResult.rows) {
            if (cantidadPendiente <= 0) break;

            const aConsumir = Math.min(cantidadPendiente, lote.cantidad_actual);

            await client.query(
                `UPDATE stock_deposito_detalle
                 SET cantidad_actual = cantidad_actual - $1
                 WHERE id = $2`,
                [aConsumir, lote.id]
            );

            cantidadPendiente -= aConsumir;
        }

        // 💡 3. REGISTRAR LA TRANSFERENCIA EN LA NUEVA TABLA
        await client.query(
            `INSERT INTO movimientos_deposito_tienda (producto_id, cantidad_movida)
             VALUES ($1, $2)`,
            [producto_id, cantidad]
        );


        // 4. El stock_total (productos.stock) NO se toca. (Lógica de negocio correcta)

        await client.query("COMMIT");
        res.json({ message: "Transferencia registrada con éxito", cantidad_movida: cantidad });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al registrar transferencia:", error);
        res.status(500).json({ error: "Error al registrar transferencia" });
    } finally {
        client.release();
    }
});

// 📌 4. NUEVA RUTA: Obtener el reporte de traslados a la tienda
router.get("/reporte", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                 DATE(mdt.fecha_traslado) AS fecha_dia, -- Agrupa por la fecha del día
                 mdt.producto_id,
                 p.nombre AS producto_nombre,
                 p.kilos AS kilos_por_unidad,
                 SUM(mdt.cantidad_movida) AS total_unidades_movidas, -- Suma las unidades
                 SUM(mdt.cantidad_movida * p.kilos) AS peso_total_movido -- Calcula el peso total por producto/día
             FROM movimientos_deposito_tienda mdt
                 JOIN productos p ON mdt.producto_id = p.id
             GROUP BY fecha_dia, mdt.producto_id, p.nombre, p.kilos
             ORDER BY fecha_dia DESC, p.nombre ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener reporte de traslados:", error);
        res.status(500).json({ error: "Error al obtener reporte de traslados" });
    }
});
export default router;