import jwt from "jsonwebtoken";

// POST /login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (userResult.rows.length === 0) return res.status(400).json({ message: "Email o contraseña incorrectos" });

        const user = userResult.rows[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Email o contraseña incorrectos" });

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, nombre: user.nombre, email: user.email },
            process.env.JWT_SECRET || "clave_secreta_supersegura",
            { expiresIn: "8h" }
        );

        res.json({ token, usuario: { id: user.id, nombre: user.nombre, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
});
