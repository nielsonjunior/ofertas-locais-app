import React from "react";

export const CATEGORIES = [
    { key: "hortifruti", label: "Hortifruti", icon: "🥬" },
    { key: "carnes", label: "Carnes", icon: "🥩" },
    { key: "bebidas", label: "Bebidas", icon: "🥤" },
    { key: "laticinios", label: "Laticínios", icon: "🥛" },
    { key: "limpeza", label: "Limpeza", icon: "🧽" },
    { key: "padaria", label: "Padaria", icon: "🥖" },
    { key: "congelados", label: "Congelados", icon: "🧊" },
    { key: "mercearia", label: "Mercearia", icon: "🛒" },
    { key: "pet", label: "Pet", icon: "🐾" },
    { key: "outros", label: "Outros", icon: "🏷️" },
];

// Subcategorias padrão (você pode substituir por dados do Firestore depois)
export const SUBCATEGORIES = {
    bebidas: ["Refrigerante", "Cerveja", "Água", "Suco", "Energético"],
    hortifruti: ["Frutas", "Verduras", "Legumes", "Temperos"],
    carnes: ["Bovina", "Frango", "Suína", "Peixe"],
    limpeza: ["Detergente", "Sabão", "Desinfetante", "Papel"],
    laticinios: ["Leite", "Queijo", "Iogurte", "Manteiga"],
    padaria: ["Pães", "Bolos", "Biscoitos"],
    congelados: ["Sorvete", "Pronto", "Pizzas", "Carnes"],
    mercearia: ["Arroz", "Feijão", "Macarrão", "Óleo", "Café"],
    pet: ["Ração", "Areia", "Petiscos"],
    outros: ["Vários"],
};

export default function CategoryChips({
    value,
    onChange,
    subValue,
    onSubChange,
}) {
    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                <Chip
                    active={!value}
                    label="Todos"
                    icon="✨"
                    onClick={() => {
                        onChange?.("");
                        onSubChange?.("");
                    }}
                />
                {CATEGORIES.map((c) => (
                    <Chip
                        key={c.key}
                        active={value === c.key}
                        label={c.label}
                        icon={c.icon}
                        onClick={() => {
                            onChange?.(c.key);
                            onSubChange?.("");
                        }}
                    />
                ))}
            </div>

            {value ? (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                    <Chip
                        active={!subValue}
                        label="Todas"
                        icon="🧩"
                        onClick={() => onSubChange?.("")}
                    />
                    {(SUBCATEGORIES[value] || []).map((s) => (
                        <Chip
                            key={s}
                            active={subValue === s}
                            label={s}
                            icon="•"
                            onClick={() => onSubChange?.(s)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function Chip({ label, icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                whiteSpace: "nowrap",
                borderRadius: 999,
                padding: "10px 12px",
                border: active ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(0,0,0,0.08)",
                background: active ? "rgba(0,0,0,0.06)" : "#fff",
                fontWeight: 800,
                cursor: "pointer",
            }}
        >
            <span style={{ marginRight: 8 }}>{icon}</span>
            {label}
        </button>
    );
}
