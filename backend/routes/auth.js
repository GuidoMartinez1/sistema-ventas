import express from "express";
import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

const router = express.Router();

// POST /login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (userResult.rows.length === 0) return res.status(400).json({ error: "Email o contraseña incorrectos" });

        const user = userResult.rows[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: "Email o contraseña incorrectos" });

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol || 'EMPLEADO' },
            process.env.JWT_SECRET || "clave_secreta_supersegura",
            { expiresIn: "8h" }
        );

        res.json({ 
            token, 
            data: { 
                id: user.id, 
                nombre: user.nombre, 
                email: user.email,
                rol: user.rol || 'EMPLEADO',
                activo: user.activo !== false
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

// POST /register
router.post(
    "/register",
    body("username").notEmpty().withMessage("El nombre es requerido"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

        const { username, email, password, rol = 'EMPLEADO' } = req.body;

        try {
            // Verificar si el email ya existe
            const existingUser = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
            if (existingUser.rows.length > 0) return res.status(400).json({ error: "Email ya registrado" });

            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insertar usuario
            const result = await pool.query(
                "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
                [username, email, password_hash, rol]
            );

            res.status(201).json({ 
                data: result.rows[0] 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al registrar usuario" });
        }
    }
);

// Middleware para verificar JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || "clave_secreta_supersegura", (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

export default router;
