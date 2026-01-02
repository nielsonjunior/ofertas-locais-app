import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function useAuthUser() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const a = getAuth();
        const unsub = onAuthStateChanged(a, (u) => {
            setUser(u || null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { user, loading, isLogged: !!user };
}
