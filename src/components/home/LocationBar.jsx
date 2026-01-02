import React from "react";
import "../../styles/app.css";

export default function LocationBar() {
    return (
        <div className="row" style={{ marginBottom: 10 }}>
            <div className="icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>📍</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>Localização</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>São Paulo, SP ▾</span>
            </div>
            <div className="space"></div>
            <button className="icon" style={{ background: '#fff', border: '1px solid var(--line)' }}>🔔</button>
        </div>
    );
}
