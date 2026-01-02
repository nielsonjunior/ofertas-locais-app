import React, { useMemo, useState } from "react";
import { useCity } from "../context/CityContext";

export default function CityPicker({ cities = [], compact = false }) {
    const { city, setCity } = useCity();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");

    const list = useMemo(() => {
        const base = (cities || []).filter(Boolean);
        const uniq = Array.from(new Set(base.map((c) => String(c).trim()))).sort();
        if (!q) return uniq;
        return uniq.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
    }, [cities, q]);

    const btnStyle = compact
        ? {
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
        }
        : {
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontWeight: 800,
            fontSize: 20,
        };

    return (
        <>
            <button onClick={() => setOpen(true)} style={btnStyle}>
                <span style={{ fontSize: compact ? 18 : 22 }}>📍</span>
                <span style={{ flex: 1 }}>{city || "Escolher cidade"}</span>
                <span style={{ opacity: 0.7 }}>▼</span>
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "flex-end",
                        zIndex: 50,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            background: "#fff",
                            borderTopLeftRadius: 18,
                            borderTopRightRadius: 18,
                            padding: 16,
                            maxHeight: "70vh",
                            overflow: "auto",
                        }}
                    >
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar cidade..."
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    borderRadius: 12,
                                    border: "1px solid #e5e7eb",
                                }}
                            />
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    border: "1px solid #e5e7eb",
                                    background: "#fff",
                                }}
                            >
                                Fechar
                            </button>
                        </div>

                        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                            {list.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setCity(c);
                                        setOpen(false);
                                    }}
                                    style={{
                                        textAlign: "left",
                                        padding: 14,
                                        borderRadius: 14,
                                        border: "1px solid #e5e7eb",
                                        background: c === city ? "#f3f4f6" : "#fff",
                                        fontWeight: 800,
                                    }}
                                >
                                    {c}
                                </button>
                            ))}

                            {list.length === 0 && (
                                <div style={{ padding: 14, opacity: 0.7 }}>Nenhuma cidade encontrada.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
