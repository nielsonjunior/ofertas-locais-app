import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { useCity } from "../context/CityContext";
import { useCategories } from "../context/CategoryContext";
import { Card, Button } from "../ui/ui.jsx";
import { theme } from "../ui/theme";

export default function Profile() {
    const nav = useNavigate();
    const { profile, loading } = useUserProfile();
    const { city } = useCity();
    const { selectedCategories } = useCategories();

    if (loading) return <div style={{ padding: 16 }}>Carregando...</div>;
    if (!profile) return <div style={{ padding: 16 }}>Perfil não encontrado.</div>;

    return (
        <div style={{ padding: 16, paddingBottom: 110, background: theme.bg, minHeight: "100dvh" }}>
            <div style={{ fontWeight: 1000, fontSize: 22, color: theme.text }}>Meu Perfil</div>

            <Card style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 1000, marginBottom: 10 }}>Dados</div>
                <div><b>Nome:</b> {profile.name || "-"}</div>
                <div><b>Telefone:</b> {profile.phone || "-"}</div>
                <div><b>Cidade do perfil:</b> {profile.city || "-"}</div>
                <div><b>Tipo:</b> {profile.role || "user"}</div>
            </Card>

            <Card style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 1000, marginBottom: 10 }}>Filtros do App</div>
                <div><b>Cidade selecionada:</b> {city || "(não selecionada)"}</div>
                <div style={{ marginTop: 6 }}>
                    <b>Categorias:</b>{" "}
                    {selectedCategories.length ? selectedCategories.join(", ") : "(todas)"}
                </div>
            </Card>

            {profile.role === "merchant" && (
                <Card style={{ marginTop: 12, background: theme.primary, color: "#fff", border: "none" }}>
                    <div style={{ fontWeight: 1000, fontSize: 16 }}>Área do Lojista</div>
                    <div style={{ opacity: 0.9, marginTop: 6 }}>Gerencie seus anúncios e dados da loja.</div>
                    <Button style={{ marginTop: 12, width: "100%" }} variant="outline" onClick={() => nav("/merchant")}>
                        Abrir Painel do Lojista
                    </Button>
                </Card>
            )}
        </div>
    );
}
