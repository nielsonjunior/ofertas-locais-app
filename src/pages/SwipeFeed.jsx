import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCity } from "../context/CityContext";
import { useCategories } from "../context/CategoryContext";
import { fetchOffersFeed } from "../utils/offersApi";
import { getCoverUrl } from "../utils/coverFallback";

export default function SwipeFeed() {
    const nav = useNavigate();
    const { city } = useCity();
    const { selectedCategories } = useCategories();

    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            // Swipe usually shows broader results, but lets respect filters slightly or just fetch all
            const data = await fetchOffersFeed({ city, categories: selectedCategories });
            setOffers(data);
            setLoading(false);
        }
        load();
    }, [city, selectedCategories]);

    if (loading) return <div style={{ height: "100vh", background: "#000", color: "#fff", display: "grid", placeContent: "center" }}>Carregando Feed...</div>;

    return (
        <div
            className="snap-container"
            style={{
                height: "100dvh",
                width: "100vw",
                overflowY: "scroll",
                scrollSnapType: "y mandatory",
                background: "#000"
            }}
        >
            {/* Floating Header Overlay */}
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
                <button onClick={() => nav(-1)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 24, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                    ←
                </button>
                <div style={{ color: "#fff", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                    {city || "Ofertas"}
                </div>
                <div style={{ width: 24 }} />
            </div>

            {offers.map((offer) => (
                <SwipeItem key={offer.id} offer={offer} />
            ))}

            {offers.length === 0 && (
                <div style={{ height: "100dvh", display: "grid", placeContent: "center", color: "#fff" }}>
                    Nenhuma oferta encontrada no feed.
                </div>
            )}
        </div>
    );
}

function SwipeItem({ offer }) {
    // Logic to calculate discount
    // Mock logic if oldPrice not exists
    const old = offer.attributes?.oldPrice || (Number(offer.price) * 1.3); // Fake old price if needed for visual
    const discount = Math.round(100 - (offer.price / old) * 100);

    return (
        <div style={{
            height: "100dvh",
            width: "100vw",
            scrollSnapAlign: "start",
            position: "relative",
            background: "#111",
            overflow: "hidden"
        }}>
            <img
                src={getCoverUrl(offer, "dark")}
                alt={offer.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
            />

            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 40%, transparent 80%)"
            }} />

            {/* Right Actions */}
            <div style={{ position: "absolute", right: 10, bottom: 100, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                <ActionButton icon="❤️" label="1.2k" />
                <ActionButton icon="💬" label="24" />
                <ActionButton icon="↗️" label="Share" />
            </div>

            {/* Content */}
            <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", padding: "20px 16px 30px" }}>
                {discount > 0 && (
                    <div style={{ display: "inline-block", background: "#ef4444", color: "#fff", fontWeight: 900, fontSize: 12, padding: "4px 8px", borderRadius: 4, marginBottom: 8 }}>
                        -{discount}% OFF
                    </div>
                )}
                <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 4, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                    {offer.title}
                </h2>
                <div style={{ color: "#e5e5e5", fontSize: 14, marginBottom: 12 }}>
                    {offer.storeName} • {offer.city}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#ccc", textDecoration: "line-through", fontSize: 13 }}>R$ {Number(old).toFixed(2)}</div>
                        <div style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>R$ {Number(offer.price).toFixed(2)}</div>
                    </div>
                    <button style={{ background: "#2563eb", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 24, fontWeight: 800, fontSize: 16 }}>
                        Eu Quero
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{label}</span>
        </div>
    )
}
