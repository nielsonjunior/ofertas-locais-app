import React from "react";
import { useUserProfile } from "../../hooks/useUserProfile";

export default function MerchantSettingsTab() {
    const { profile } = useUserProfile();

    return (
        <div style={{ padding: 20 }}>
            {/* Mock Settings */}
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Loja & Perfil</h2>

            <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Nome da Loja</div>
                <div style={{ padding: 10, background: "#f9fafb", borderRadius: 8 }}>{profile?.displayName || "Minha Loja"}</div>
            </div>

            <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Plano Atual</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "green", fontWeight: 800 }}>Premium Ativo</span>
                    <button style={{ padding: "6px 12px", fontSize: 12, background: "#000", color: "#fff", border: "none", borderRadius: 100 }}>Gerenciar</button>
                </div>
            </div>

            <p style={{ opacity: 0.5, fontSize: 13, textAlign: "center", marginTop: 40 }}>
                Em breve mais configurações...
            </p>
        </div>
    );
}
