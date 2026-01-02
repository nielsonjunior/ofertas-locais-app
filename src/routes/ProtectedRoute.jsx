import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ children }) {
    const auth = getAuth();
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setChecking(false);
        });
        return () => unsubscribe();
    }, []);

    if (checking) return <div style={{ padding: 20 }}>Carregando...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
