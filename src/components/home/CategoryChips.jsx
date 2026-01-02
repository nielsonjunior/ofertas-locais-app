import React from "react";
import "../../styles/app.css";

const CATEGORIES = [
    "Todos", "Hortifruti", "Carnes", "Bebidas", "Padaria", "Limpeza", "Laticínios"
];

export default function CategoryChips({ active, onChange }) {
    return (
        <div className="chips">
            {CATEGORIES.map(cat => (
                <div
                    key={cat}
                    className={`chip ${active === cat ? 'active' : ''}`}
                    onClick={() => onChange(cat)}
                >
                    {cat}
                </div>
            ))}
        </div>
    );
}
