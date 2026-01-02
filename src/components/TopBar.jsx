import React from "react";
import { useNavigate } from "react-router-dom";
import CityPicker from "./CityPicker";

// Example cities
const CITIES = ["Sorocaba", "São Paulo", "Campinas", "Santos", "Jundiai", "Itu"];

export default function TopBar() {
    const nav = useNavigate();

    return (
        <div
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "#fff",
                borderBottom: "1px solid #f3f4f6",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "10px 16px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Logo / Title */}
                    <div onClick={() => nav("/")} style={{ fontWeight: 900, fontSize: 20, cursor: "pointer", color: "#111" }}>
                        <span style={{ color: "#ef4444" }}>Ofertas</span>Locais
                    </div>

                    <div style={{ display: "flex", gap: 14 }}>
                        <button style={{ background: "none", border: "none", fontSize: 20 }}>🔍</button>
                        <button style={{ background: "none", border: "none", fontSize: 20 }}>🔔</button>
                        <button onClick={() => nav("/profile")} style={{ background: "none", border: "none", fontSize: 20, borderRadius: "50%", overflow: "hidden" }}>
                            👤
                        </button>
                    </div>
                </div>

                {/* City Picker Row */}
                <div>
                    <CityPicker cities={CITIES} compact />
                </div>
            </div>
        </div>
    );
}
