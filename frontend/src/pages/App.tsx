import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

interface Usuario {
    id: number;
    nombre: string;
    email: string;
}

export default function App() {
    const [user, setUser] = useState<Usuario | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // opcional: decodificar token
            setUser({ id: 1, nombre: "Usuario", email: "usuario@ejemplo.com" });
        }
    }, []);

    if (!user) {
        return (
            <div>
                <Login onLogin={setUser} />
                <Register onRegister={setUser} />
            </div>
        );
    }

    return <Dashboard user={user} />;
}
