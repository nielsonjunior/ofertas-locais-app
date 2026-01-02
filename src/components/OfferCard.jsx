import React, { useState } from "react";

function money(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v || "");
    return n.toFixed(2).replace(".", ",");
}

export default function OfferCard({ offer, onClick }) {
    const img =
        offer?.images?.coverLightUrl ||
        offer?.images?.coverDarkUrl ||
        offer?.coverImageUrl ||
        "";

    const discount =
        offer?.oldPrice && offer?.price
            ? Math.round(((Number(offer.oldPrice) - Number(offer.price)) / Number(offer.oldPrice)) * 100)
            : null;

    return (
        <div
            onClick={onClick}
            role="button"
            style={{
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                cursor: "pointer",
                display: "grid",
            }}
        >
            <div style={{ position: "relative", aspectRatio: "4/3", background: "#f1f5f9" }}>
                {img ? (
                    <img src={img} alt={offer.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#64748b", fontWeight: 900 }}>
                        Sem imagem
                    </div>
                )}

                {discount ? (
                    <div
                        style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: "#16a34a",
                            color: "#fff",
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontWeight: 900,
                            fontSize: 12,
                            boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                        }}
                    >
                        -{discount}%
                    </div>
                ) : null}
            </div>

            <div style={{ padding: 12, display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 950, fontSize: 15, lineHeight: 1.15 }}>{offer.title}</div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 20, color: "#16a34a" }}>
                        R$ {money(offer.price)}
                    </div>
                    {offer.oldPrice ? (
                        <div style={{ textDecoration: "line-through", color: "#64748b", fontWeight: 800, fontSize: 13 }}>
                            R$ {money(offer.oldPrice)}
                        </div>
                    ) : null}
                </div>

                <div style={{ color: "#475569", fontWeight: 700, fontSize: 13 }}>
                    {offer.marketName || "Mercado"} • {offer.cityName || offer.cityId}
                </div>

                <div
                    style={{
                        marginTop: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#0f172a", opacity: 0.75 }}>
                        {offer.category ? String(offer.category).toUpperCase() : "OFERTA"}
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 900,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "rgba(250, 204, 21, 0.35)",
                            border: "1px solid rgba(250, 204, 21, 0.55)",
                            color: "#0f172a",
                        }}
                    >
                        Ver
                    </span>
                </div>
            </div>
        </div>
    );
}
