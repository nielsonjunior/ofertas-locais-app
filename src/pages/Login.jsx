import React, { useState } from "react";
import { loginEmail, signupEmail } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Login({ initialMode = "login" }) {
    const nav = useNavigate();
    const [mode, setMode] = useState(initialMode); // login | signup
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            if (mode === "signup") await signupEmail(email, password);
            else await loginEmail(email, password);
            nav("/");
        } catch (e2) {
            setErr(e2?.message || "Erro");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f6f7fb", display: "grid", placeItems: "center", padding: 16 }}>
            <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 18, padding: 16, border: "1px solid rgba(0,0,0,0.06)" }}>
                <h1 style={{ fontWeight: 950, fontSize: 22, margin: 0 }}>Entrar</h1>
                <p style={{ marginTop: 6, color: "#475569", fontWeight: 700 }}>
                    Faça login para favoritar e avaliar produtos.
                </p>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button onClick={() => setMode("login")} style={mode === "login" ? tabOn : tabOff}>Login</button>
                    <button onClick={() => setMode("signup")} style={mode === "signup" ? tabOn : tabOff}>Criar conta</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <label>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} style={input} type="email" required />

                    <label>Senha</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} style={input} type="password" required />

                    {err ? <div style={{ color: "#dc2626", fontWeight: 800 }}>{err}</div> : null}

                    <button disabled={busy} style={btnPrimary}>
                        {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
                    </button>

                    <button type="button" onClick={() => nav("/")} style={btnGhost}>
                        Voltar
                    </button>
                </form>
            </div>
        </div>
    );
}

const input = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    padding: "12px 14px",
    fontWeight: 800,
    outline: "none",
    background: "#fff",
};

const btnPrimary = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "#FACC15",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(250,204,21,0.25)",
};

const btnGhost = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
};

const tabOn = {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(0,0,0,0.06)",
    fontWeight: 900,
    cursor: "pointer",
};
const tabOff = {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
};
