import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, limit, getDocs } from "firebase/firestore";
import OfferCard from "../components/OfferCard";

export default function Market() {
    const { id } = useParams();
    const nav = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const db = getFirestore();
            const q = query(collection(db, "offers"), where("marketId", "==", id), where("active", "==", true), limit(200));
            const snap = await getDocs(q);
            setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }
        load();
    }, [id]);

    const marketName = offers?.[0]?.marketName || "Mercado";

    return (
        <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: 14, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <button onClick={() => nav(-1)} style={btnGhost}>← Voltar</button>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{marketName}</div>
                    <button onClick={() => nav("/swipe")} style={btnPrimary}>⚡ Modo Rápido</button>
                </div>

                {loading ? (
                    <div style={{ fontWeight: 800 }}>Carregando…</div>
                ) : offers.length === 0 ? (
                    <div style={box}>Sem ofertas ativas neste mercado.</div>
                ) : (
                    <div style={grid}>
                        {offers.map((o) => (
                            <OfferCard key={o.id} offer={o} onClick={() => nav(`/offer/${o.id}`)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const grid = { display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" };

const box = {
    padding: 18,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.06)",
    color: "#334155",
    fontWeight: 800,
};

const btnGhost = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
};

const btnPrimary = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "none",
    background: "#FACC15",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(250,204,21,0.25)",
};
