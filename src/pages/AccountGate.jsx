import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useUserProfile } from "../hooks/useUserProfile";

export default function AccountGate() {
    const nav = useNavigate();
    const auth = getAuth();
    const { profile, loading, uid } = useUserProfile();

    useEffect(() => {
        if (!loading) {
            if (!uid) {
                // Not logged in -> go to login
                nav("/login");
            } else if (profile) {
                // Logged & has profile -> go profile
                nav("/profile");
            } else {
                // Logged but no profile doc -> maybe onboarding? or just profile
                nav("/profile");
            }
        }
    }, [loading, uid, profile, nav]);

    return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Loading...
        </div>
    );
}
