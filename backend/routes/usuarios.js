import express from "express";
import pool from "../db.js"; // tu conexión a Neon
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

const router = express.Router();

// POST /register
router.post(
    "/register",
    body("nombre").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { nombre, email, password } = req.body;

        try {
            // Verificar si el email ya existe
            const existingUser = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
            if (existingUser.rows.length > 0) return res.status(400).json({ message: "Email ya registrado" });

            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insertar usuario
            const result = await pool.query(
                "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email",
                [nombre, email, password_hash]
            );

            res.status(201).json({ usuario: result.rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al registrar usuario" });
        }
    }
);

export default router;