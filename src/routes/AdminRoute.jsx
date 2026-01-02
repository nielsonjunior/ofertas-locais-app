import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function AdminRoute({ children }) {
    const auth = getAuth();
    const [checking, setChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        return auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setIsAdmin(false);
                setChecking(false);
                return;
            }

            // 1. Tenta Custom Claim
            try {
                const token = await user.getIdTokenResult();
                if (token.claims.admin) {
                    setIsAdmin(true);
                    setChecking(false);
                    return;
                }
            } catch (e) { console.error(e); }

            // 2. Fallback: Email específico (TEMP)
            // Ajuste com seus emails de admin
            const admins = ["admin@ofertas.com", "teste@admin.com"];
            if (admins.includes(user.email)) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setChecking(false);
        });
    }, []);

    if (checking) return <div style={{ padding: 20 }}>Verificando permissões...</div>;

    if (!isAdmin) {
        // Se logado mas não admin, volta pra home
        return <Navigate to="/" replace />;
    }

    return children;
}
