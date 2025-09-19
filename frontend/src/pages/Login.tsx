import { useState, FormEvent } from "react";
import { authAPI, User } from "../services/api";

interface Props {
    onLogin: (usuario: User) => void;
}

export default function Login({ onLogin }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await authAPI.login({ email, password });
            localStorage.setItem("token", res.data.token); // Guardamos JWT
            onLogin(res.data); // devuelve usuario
            alert("Login exitoso");
        } catch (err: any) {
            setError(err.response?.data?.error || "Error al iniciar sesión");
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
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
            <button type="submit">Ingresar</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
}
