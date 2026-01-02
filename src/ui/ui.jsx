import React from "react";
import { theme } from "./theme";

export function Card({ children, style }) {
    return (
        <div
            style={{
                background: theme.card,
                border: theme.border,
                borderRadius: theme.radius2,
                boxShadow: theme.shadow,
                padding: 16,
                ...style,
            }}
        >

            {children}
        </div>
    );
}

export function Row({ children, style }) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>{children}</div>;
}

export function Button({ children, variant = "solid", style, ...props }) {
    const base = {
        borderRadius: 16,
        padding: "12px 14px",
        fontWeight: 900,
        border: "none",
        cursor: "pointer",
        transition: "transform 0.05s ease",
    };

    const variants = {
        solid: { background: theme.primary, color: theme.primaryText },
        ghost: { background: theme.soft, color: theme.text },
        outline: { background: "#fff", color: theme.text, border: theme.border },
        danger: { background: theme.dangerSoft, color: theme.text, border: theme.dangerBorder },
    };

    return (
        <button
            {...props}
            style={{ ...base, ...variants[variant], ...style }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
            {children}
        </button>
    );
}

export function Input(props) {
    return (
        <input
            {...props}
            style={{
                width: "100%",
                padding: 12,
                borderRadius: 16,
                border: theme.border,
                background: "#fff",
                fontWeight: 800,
                outline: "none",
            }}
        />
    );
}

export function Chip({ children, active = false, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                borderRadius: 999,
                padding: "10px 12px",
                border: theme.border,
                background: active ? theme.primary : "#fff",
                color: active ? "#fff" : theme.text,
                fontWeight: 900,
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    );
}
