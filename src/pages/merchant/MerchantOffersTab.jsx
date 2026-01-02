import React, { useEffect, useState } from "react";
import { fetchMyOffers, removeOffer, setOfferStatus } from "../../utils/offersApi"; // Assuming context or static merchant ID
// For demo, we are using a fixed "demoMerchant" or getting from profile
import { useUserProfile } from "../../hooks/useUserProfile";
import { getCoverUrl } from "../../utils/coverFallback";

export default function MerchantOffersTab({ onChangeTab }) {
    const { profile } = useUserProfile(); // Assuming profile has merchant info or using uid
    // For easy dev testing, lets use uid as merchantId
    const merchantId = profile?.uid;

    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (merchantId) load();
    }, [merchantId]);

    async function load() {
        setLoading(true);
        try {
            const data = await fetchMyOffers(merchantId);
            setOffers(data);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (window.confirm("Tem certeza que deseja apagar este anúncio?")) {
            await removeOffer(id);
            load();
        }
    }

    async function handleToggleStatus(offer) {
        const newStatus = offer.status === "active" ? "paused" : "active";
        await setOfferStatus(offer.id, newStatus);
        load();
    }

    if (loading) return <div style={{ padding: 20 }}>Carregando anúncios...</div>;

    return (
        <div style={{ padding: 16 }}>
            {offers.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, opacity: 0.6 }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
                    <p>Você ainda não tem anúncios.</p>
                    <button
                        onClick={() => onChangeTab("create")}
                        style={{ marginTop: 20, padding: "12px 24px", background: "#ef4444", color: "#fff", fontWeight: 800, borderRadius: 12, border: "none" }}
                    >
                        Criar Primeiro Anúncio
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {offers.map(o => (
                        <div key={o.id} style={{ background: "#fff", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #e5e7eb", opacity: o.status === "paused" ? 0.6 : 1 }}>
                            <img src={getCoverUrl(o)} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", background: "#eee" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>{o.title}</div>
                                <div style={{ fontSize: 13, color: "#666" }}>R$ {Number(o.price).toFixed(2)}</div>
                                <div style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 8 }}>
                                    <span style={{ color: o.status === "active" ? "green" : "orange" }}>• {o.status === "active" ? "Ativo" : "Pausado"}</span>
                                    <span>👁️ {o.views || 0}</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <button onClick={() => handleToggleStatus(o)} style={{ fontSize: 12, padding: "6px 10px", background: "#f3f4f6", border: "none", borderRadius: 6 }}>
                                    {o.status === "active" ? "Pausar" : "Ativar"}
                                </button>
                                <button style={{ fontSize: 12, padding: "6px 10px", background: "#f3f4f6", border: "none", borderRadius: 6 }}>Editar</button>
                                <button onClick={() => handleDelete(o.id)} style={{ fontSize: 12, padding: "6px 10px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6 }}>Excluir</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
