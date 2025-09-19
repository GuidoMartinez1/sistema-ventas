import { useState, FormEvent } from "react";
import { authAPI, User } from "../services/api";

interface Props {
    onRegister: (usuario: User) => void;
}

export default function Register({ onRegister }: Props) {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await authAPI.register({ username: nombre, email, password });
            onRegister(res.data); // devuelve el usuario creado
            alert("Registro exitoso");
        } catch (err: any) {
            setError(err.response?.data?.error || "Error al registrar usuario");
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Registro</h2>
            <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Registrarse</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
}
