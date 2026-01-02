import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MerchantTopBar from "./MerchantTopBar";
import MerchantOffersTab from "./MerchantOffersTab";
import MerchantCreateTab from "./MerchantCreateTab";
import MerchantSettingsTab from "./MerchantSettingsTab";
import { useUserProfile } from "../../hooks/useUserProfile";

export default function MerchantHub() {
    const [activeTab, setActiveTab] = useState("ads"); // ads, create, settings
    const nav = useNavigate();
    const { profile, loading } = useUserProfile();

    if (loading) return <div style={{ padding: 20 }}>Carregando painel...</div>;
    if (profile?.role !== "merchant" && profile?.role !== "admin") {
        return (
            <div style={{ padding: 40, textAlign: "center" }}>
                <h2>Acesso Restrito</h2>
                <p>Você não tem permissão de lojista.</p>
                <button onClick={() => nav("/")} style={{ marginTop: 20, padding: 10 }}>Voltar ao Início</button>
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f3f4f6" }}>
            <MerchantTopBar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div style={{ flex: 1, overflowY: "auto" }}>
                {activeTab === "ads" && <MerchantOffersTab onChangeTab={setActiveTab} />}
                {activeTab === "create" && <MerchantCreateTab onFinish={() => setActiveTab("ads")} />}
                {activeTab === "settings" && <MerchantSettingsTab />}
            </div>
        </div>
    );
}
