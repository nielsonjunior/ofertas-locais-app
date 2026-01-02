import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFavorites } from "../utils/favorites";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Favorites() {
    const nav = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const db = getFirestore();
            const favs = getFavorites();
            const list = [];
            for (const id of favs) {
                const snap = await getDoc(doc(db, "offers", id));
                if (snap.exists()) list.push({ id: snap.id, ...snap.data() });
            }
            setItems(list);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <div className="h-wrap">
            <div className="sectionRow">
                <div className="sectionTitle">Favoritos</div>
                <button className="btn btn-ghost" onClick={() => nav("/swipe")}>⚡ Swipe</button>
            </div>

            {loading ? (
                <div style={{ fontWeight: 900, color: "#64748b" }}>Carregando…</div>
            ) : items.length === 0 ? (
                <div style={{ padding: 14, background: "#fff", border: "1px solid rgba(15,23,42,.06)", borderRadius: 18, fontWeight: 800, color: "#475569" }}>
                    Você ainda não salvou ofertas.
                </div>
            ) : (
                <div className="grid">
                    {items.map((o) => (
                        <div key={o.id} className="pcard" onClick={() => nav(`/offer/${o.id}`)} style={{ cursor: "pointer" }}>
                            <div className="pimg">
                                {o?.images?.coverLightUrl ? <img src={o.images.coverLightUrl} alt={o.title} /> : null}
                            </div>
                            <div className="pbody">
                                <div className="ptitle">{o.title}</div>
                                <div className="pmeta">{o.marketName || "Mercado"} • {o.cityName || o.cityId}</div>
                                <div className="pprice">R$ {Number(o.price || 0).toFixed(2).replace(".", ",")}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
