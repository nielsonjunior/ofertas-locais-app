import React from "react";
import { useNavigate } from "react-router-dom";

export default function MerchantTopBar({ activeTab, setActiveTab }) {
    const nav = useNavigate();

    const tabStyle = (id) => ({
        flex: 1,
        textAlign: "center",
        padding: "16px 0",
        borderBottom: activeTab === id ? "3px solid #ef4444" : "3px solid transparent",
        color: activeTab === id ? "#111" : "#888",
        fontWeight: 800,
        cursor: "pointer",
        background: "none",
        borderLeft: "none",
        borderRight: "none",
        borderTop: "none",
        fontSize: 14
    });

    return (
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <div style={{ fontWeight: 900, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🏪</span> Painel Lojista
                </div>
                <button onClick={() => nav("/profile")} style={{ fontSize: 13, padding: "6px 12px", background: "#f3f4f6", borderRadius: 20, border: "none", fontWeight: 700 }}>
                    Sair
                </button>
            </div>

            <div style={{ display: "flex" }}>
                <button style={tabStyle("ads")} onClick={() => setActiveTab("ads")}>MEUS ANÚNCIOS</button>
                <button style={tabStyle("create")} onClick={() => setActiveTab("create")}>CADASTRAR</button>
                <button style={tabStyle("settings")} onClick={() => setActiveTab("settings")}>LOJA & PERFIL</button>
            </div>
        </div>
    );
}
