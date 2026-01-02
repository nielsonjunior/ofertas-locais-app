import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CategoryPickerModal from "./CategoryPickerModal";
import { theme } from "../ui/theme";

export default function BottomNav() {
    const nav = useNavigate();
    const { pathname } = useLocation();
    const [catOpen, setCatOpen] = useState(false);

    const isActive = (path) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

    const item = (active) => ({
        flex: 1,
        padding: "10px 6px",
        border: "none",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        fontWeight: 900,
        fontSize: 12,
        color: active ? theme.text : theme.muted,
    });

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    left: 12,
                    right: 12,
                    bottom: 12,
                    paddingBottom: "env(safe-area-inset-bottom)",
                    background: "#fff",
                    borderRadius: 22,
                    border: theme.border,
                    boxShadow: theme.shadow,
                    display: "flex",
                    zIndex: 40,
                }}
            >
                <button style={item(isActive("/"))} onClick={() => nav("/")}>
                    <div style={{ fontSize: 18 }}>🏠</div>Início
                </button>

                <button style={item(catOpen)} onClick={() => setCatOpen(true)}>
                    <div style={{ fontSize: 18 }}>🗂️</div>Categorias
                </button>

                <button style={item(isActive("/swipe"))} onClick={() => nav("/swipe")}>
                    <div style={{ fontSize: 18 }}>⚡</div>Swipe
                </button>

                <button style={item(isActive("/account") || isActive("/profile"))} onClick={() => nav("/account")}>
                    <div style={{ fontSize: 18 }}>👤</div>Perfil
                </button>
            </div>

            <CategoryPickerModal open={catOpen} onClose={() => setCatOpen(false)} />
        </>
    );
}
