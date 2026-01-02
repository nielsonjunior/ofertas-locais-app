import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import RatingBox from "../components/RatingBox";
import { isFavorite, toggleFavorite } from "../utils/favorites";

function money(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v || "");
    return n.toFixed(2).replace(".", ",");
}

export default function OfferDetails() {
    const { id } = useParams();
    const nav = useNavigate();
    const [offer, setOffer] = useState(null);

    useEffect(() => {
        async function load() {
            const db = getFirestore();
            const ref = doc(db, "offers", id);
            const snap = await getDoc(ref);
            setOffer(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        }
        load();
    }, [id]);

    if (!offer) return <div style={{ padding: 16 }}>Carregando…</div>;

    const img = offer?.images?.coverLightUrl || offer?.images?.coverDarkUrl || offer?.coverImageUrl || "";
    const fav = isFavorite(offer.id);

    function openWhatsApp() {
        const text = encodeURIComponent(
            `Olá! Quero essa oferta: ${offer.title} por R$ ${money(offer.price)}. Mercado: ${offer.marketName || ""}`
        );
        const phone = offer?.marketPhone || "";
        if (phone) window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
        else window.open(`https://web.whatsapp.com/send?text=${text}`, "_blank");
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 14, display: "grid", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <button onClick={() => nav(-1)} style={btnGhost}>← Voltar</button>
                    <button onClick={() => nav(`/swipe?start=${offer.id}`)} style={btnPrimary}>⚡ Abrir no Swipe</button>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ aspectRatio: "16/9", background: "#e2e8f0" }}>
                        {img ? <img src={img} alt={offer.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                    </div>
                    <div style={{ padding: 14, display: "grid", gap: 10 }}>
                        <div style={{ fontWeight: 950, fontSize: 22 }}>{offer.title}</div>
                        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                            <div style={{ fontWeight: 950, fontSize: 28, color: "#16a34a" }}>R$ {money(offer.price)}</div>
                            {offer.oldPrice ? <div style={{ textDecoration: "line-through", fontWeight: 800, color: "#64748b" }}>R$ {money(offer.oldPrice)}</div> : null}
                        </div>
                        <div style={{ fontWeight: 800, color: "#475569" }}>
                            {offer.marketName || "Mercado"} • {offer.cityName || offer.cityId}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                            <button onClick={() => nav(`/market/${offer.marketId || "market_001"}`)} style={btnGhost}>Ver mercado</button>
                            <button
                                onClick={() => {
                                    toggleFavorite(offer.id);
                                    alert(fav ? "Removido dos salvos" : "Salvo!");
                                }}
                                style={btnGhost}
                            >
                                {fav ? "Salvo ✓" : "Salvar"}
                            </button>
                        </div>

                        <button onClick={openWhatsApp} style={btnGhost}>
                            WhatsApp
                        </button>
                    </div>
                </div>

                <RatingBox offerId={offer.id} />
            </div>
        </div>
    );
}

const btnGhost = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
};

const btnPrimary = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "#FACC15",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(250,204,21,0.25)",
};
