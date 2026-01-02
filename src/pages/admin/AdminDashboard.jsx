import React from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/layout/MobileShell";
import "../../styles/app.css";

export default function AdminDashboard() {
    const nav = useNavigate();

    return (
        <MobileShell showNav={false}>
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', fontSize: 24 }}>←</button>
                    <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Painel Admin</h1>
                </div>

                <div className="grid">
                    <div className="card" onClick={() => nav('/admin/offers/new')} style={{ padding: 20, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>➕</div>
                        <div style={{ fontWeight: 800 }}>Criar Oferta</div>
                    </div>

                    <div className="card" onClick={() => nav('/admin/offers')} style={{ padding: 20, cursor: 'pointer', textAlign: 'center', opacity: 0.5 }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                        <div style={{ fontWeight: 800 }}>Gerenciar</div>
                        <div style={{ fontSize: 10 }}>(Em breve)</div>
                    </div>

                    <div className="card" onClick={() => nav('/')} style={{ padding: 20, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
                        <div style={{ fontWeight: 800 }}>Ir para Home</div>
                    </div>
                </div>

            </div>
        </MobileShell>
    );
}
