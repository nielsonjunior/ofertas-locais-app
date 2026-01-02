import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

// enquanto você não configurar custom claim, coloque aqui o email do admin:
const FALLBACK_ADMIN_EMAILS = [
    // "teste3@test.com",
];

export function useIsAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loadingAdmin, setLoadingAdmin] = useState(true);

    useEffect(() => {
        async function run() {
            setLoadingAdmin(true);
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) {
                    setIsAdmin(false);
                    setLoadingAdmin(false);
                    return;
                }
                const token = await user.getIdTokenResult(true);
                const claimAdmin = token?.claims?.admin === true;
                const emailAdmin = !!user.email && FALLBACK_ADMIN_EMAILS.includes(user.email);
                setIsAdmin(claimAdmin || emailAdmin);
            } catch {
                setIsAdmin(false);
            } finally {
                setLoadingAdmin(false);
            }
        }
        run();
    }, []);

    return { isAdmin, loadingAdmin };
}
