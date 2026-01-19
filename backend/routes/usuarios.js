import express from "express";
import pool from "../db.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// GET /usuarios - Obtener todos los usuarios (solo para admin)
router.get("/", authenticateToken, async (req, res) => {
    try {
        // Verificar que sea admin
        if (req.user.rol !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
        }
        
        const result = await pool.query("SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// GET /usuarios/:id - Obtener usuario por ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT id, nombre, email, created_at FROM usuarios WHERE id = $1", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener usuario" });
    }
});

// PUT /usuarios/:id - Actualizar usuario
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, activo, password } = req.body;
        
        // Verificar que el usuario existe
        const existingUser = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        // Verificar si el email ya existe en otro usuario
        if (email) {
            const emailCheck = await pool.query("SELECT * FROM usuarios WHERE email = $1 AND id != $2", [email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: "Email ya registrado" });
            }
        }
        
        let updateQuery = "UPDATE usuarios SET nombre = COALESCE($1, nombre), email = COALESCE($2, email)";
        let queryParams = [nombre, email];
        let paramIndex = 3;
        
        // Agregar rol si se proporciona
        if (rol) {
            updateQuery += `, rol = $${paramIndex}`;
            queryParams.push(rol);
            paramIndex++;
        }
        
        // Agregar estado activo si se proporciona
        if (activo !== undefined) {
            updateQuery += `, activo = $${paramIndex}`;
            queryParams.push(activo);
            paramIndex++;
        }
        
        // Agregar contraseña si se proporciona
        if (password) {
            const bcrypt = await import('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            updateQuery += `, password_hash = $${paramIndex}`;
            queryParams.push(password_hash);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex} RETURNING id, nombre, email, rol, activo`;
        queryParams.push(id);
        
        const result = await pool.query(updateQuery, queryParams);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// DELETE /usuarios/:id - Eliminar usuario
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el usuario existe
        const existingUser = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

export default router;