import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCity } from "../context/CityContext";
import { useCategories } from "../context/CategoryContext";
import { fetchOffersFeed } from "../utils/offersApi";
import { getCoverUrl } from "../utils/coverFallback";

export default function Home() {
    const { city } = useCity();
    const { selectedCategories } = useCategories();

    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Carregar ofertas filtradas
        async function load() {
            setLoading(true);
            try {
                const data = await fetchOffersFeed({ city, categories: selectedCategories });
                setOffers(data);
            } catch (err) {
                console.error("Failed to load feed", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [city, selectedCategories]);

    return (
        <div style={{ paddingBottom: 20 }}>
            {/* Featured Banner Row - apenas exemplo estático ou pegar do feed */}
            <div style={{ overflowX: "auto", display: "flex", gap: 12, padding: "16px 16px 0 16px", scrollSnapType: "x mandatory" }}>
                {/* Placeholder Banners */}
                <div style={{ minWidth: "85%", height: 160, borderRadius: 16, background: "linear-gradient(45deg, #111, #333)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", scrollSnapAlign: "center" }}>
                    <div style={{ textAlign: "center" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Destaques da Semana</h2>
                        <p style={{ opacity: 0.8 }}>Confira as melhores ofertas</p>
                    </div>
                </div>
                <div style={{ minWidth: "85%", height: 160, borderRadius: 16, background: "linear-gradient(45deg, #ef4444, #b91c1c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", scrollSnapAlign: "center" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>Lojas Parceiras</h2>
                </div>
            </div>

            {/* Filter Status */}
            <div style={{ padding: "16px 16px 8px" }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                    {city ? `Ofertas em ${city}` : "Ofertas Recentes"}
                </h2>
                {selectedCategories.length > 0 && (
                    <div style={{ fontSize: 13, color: "#666" }}>
                        Filtros: {selectedCategories.join(", ")}
                    </div>
                )}
            </div>

            {loading && <div style={{ padding: 20 }}>Carregando ofertas...</div>}

            <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {!loading && offers.map((offer) => (
                    <div key={offer.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f3f4f6" }}>
                        <div style={{ height: 120, position: "relative" }}>
                            <img
                                src={getCoverUrl(offer)}
                                alt={offer.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {offer.discount > 0 && (
                                <div style={{ position: "absolute", bottom: 4, left: 4, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                                    -{offer.discount}%
                                </div>
                            )}
                        </div>
                        <div style={{ padding: 10 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, height: 34, overflow: "hidden" }}>{offer.title}</div>
                            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{offer.storeName}</div>
                            <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>R$ {Number(offer.price).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && offers.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", opacity: 0.6 }}>
                        Nenhuma oferta encontrada para os filtros atuais.
                    </div>
                )}
            </div>
        </div>
    );
}
