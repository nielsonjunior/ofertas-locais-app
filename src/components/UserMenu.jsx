import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { logout } from "../utils/auth";

export default function UserMenu() {
    const nav = useNavigate();
    const { user, loading } = useAuthUser();

    if (loading) return null;

    if (!user) {
        return (
            <button onClick={() => nav("/login")} style={btnGhost}>
                Entrar
            </button>
        );
    }

    return (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900, color: "#0f172a", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
            </div>
            <button
                onClick={async () => {
                    await logout();
                    nav("/");
                }}
                style={btnGhost}
            >
                Sair
            </button>
        </div>
    );
}

const btnGhost = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
};
