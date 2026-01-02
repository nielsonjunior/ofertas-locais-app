import React, { useMemo, useState } from "react";
import { useCategories } from "../context/CategoryContext";

const DEFAULT_CATEGORIES = [
    "Mercado",
    "Farmácia",
    "Açougue",
    "Padaria",
    "Hortifruti",
    "Bebidas",
    "Pet",
    "Construção",
    "Eletrônicos",
    "Moda",
    "Restaurante",
    "Outros",
];

export default function CategoryPickerModal({ open, onClose, categories = DEFAULT_CATEGORIES }) {
    const { selectedCategories, setSelectedCategories } = useCategories();
    const [q, setQ] = useState("");

    const list = useMemo(() => {
        const base = (categories || []).filter(Boolean);
        const uniq = Array.from(new Set(base.map((c) => String(c).trim()))).sort();
        if (!q) return uniq;
        return uniq.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
    }, [categories, q]);

    if (!open) return null;

    const toggle = (cat) => {
        setSelectedCategories((prev) => {
            const has = prev.includes(cat);
            if (has) return prev.filter((x) => x !== cat);
            return [...prev, cat];
        });
    };

    const clearAll = () => setSelectedCategories([]);
    const selectAllVisible = () => setSelectedCategories(list.slice(0, 10)); // segura por causa do Firestore "in" <= 10

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "flex-end",
                zIndex: 60,
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
                    maxHeight: "75vh",
                    overflow: "auto",
                }}
            >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar categoria..."
                        style={{
                            width: "100%",
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                        }}
                    />
                    <button
                        onClick={onClose}
                        style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}
                    >
                        Fechar
                    </button>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                        onClick={clearAll}
                        style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800 }}
                    >
                        Limpar
                    </button>
                    <button
                        onClick={selectAllVisible}
                        style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800 }}
                    >
                        Selecionar (até 10)
                    </button>
                    <div style={{ marginLeft: "auto", padding: "10px 0", fontWeight: 900 }}>
                        {selectedCategories.length} selecionadas
                    </div>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {list.map((cat) => {
                        const active = selectedCategories.includes(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => toggle(cat)}
                                style={{
                                    textAlign: "left",
                                    padding: 14,
                                    borderRadius: 14,
                                    border: "1px solid #e5e7eb",
                                    background: active ? "#111827" : "#fff",
                                    color: active ? "#fff" : "#111",
                                    fontWeight: 900,
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>{cat}</span>
                                <span style={{ opacity: 0.85 }}>{active ? "✓" : ""}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedCategories.length > 10 && (
                    <div style={{ marginTop: 10, color: "#b45309", fontWeight: 800 }}>
                        Atenção: Firestore “in” aceita até 10 categorias. Mantemos até 10 para filtro perfeito.
                    </div>
                )}
            </div>
        </div>
    );
}
