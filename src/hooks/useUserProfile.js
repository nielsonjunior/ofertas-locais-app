import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";

export function useUserProfile() {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const ref = doc(db, "users", uid);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                setProfile(snap.exists() ? { uid, ...snap.data() } : null);
                setLoading(false);
            },
            () => setLoading(false)
        );

        return () => unsub();
    }, [uid]);

    return { profile, loading, uid };
}
