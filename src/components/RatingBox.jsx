import React, { useEffect, useMemo, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { getMyRating, listRatings, upsertRating } from "../utils/ratingsApi";
import { useNavigate } from "react-router-dom";

export default function RatingBox({ offerId }) {
    const nav = useNavigate();
    const { user, loading } = useAuthUser();
    const [ratings, setRatings] = useState([]);
    const [myStars, setMyStars] = useState(5);
    const [myComment, setMyComment] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        async function load() {
            const all = await listRatings(offerId, 50);
            setRatings(all);
        }
        load();
    }, [offerId]);

    useEffect(() => {
        async function loadMine() {
            if (!user) return;
            const mine = await getMyRating(offerId, user.uid);
            if (mine) {
                setMyStars(mine.stars || 5);
                setMyComment(mine.comment || "");
            }
        }
        loadMine();
    }, [offerId, user]);

    const summary = useMemo(() => {
        if (!ratings.length) return { avg: 0, count: 0 };
        const sum = ratings.reduce((a, r) => a + Number(r.stars || 0), 0);
        return { avg: sum / ratings.length, count: ratings.length };
    }, [ratings]);

    async function submit() {
        if (!user) return nav("/login");
        if (myStars < 1 || myStars > 5) return;

        setBusy(true);
        try {
            await upsertRating(offerId, user, { stars: myStars, comment: myComment });
            const all = await listRatings(offerId, 50);
            setRatings(all);
            alert("Avaliação salva!");
        } catch (e) {
            alert(e?.message || "Erro ao salvar avaliação");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 14, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>Avaliações</div>
                    <div style={{ color: "#475569", fontWeight: 800 }}>
                        {summary.count ? `${summary.avg.toFixed(1)} / 5 • ${summary.count} avaliações` : "Ainda sem avaliações"}
                    </div>
                </div>
                <StarsDisplay value={summary.count ? summary.avg : 0} />
            </div>

            {loading ? null : !user ? (
                <button onClick={() => nav("/login")} style={btnPrimary}>
                    Entrar para avaliar
                </button>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>Sua nota</div>
                    <StarsPicker value={myStars} onChange={setMyStars} />
                    <textarea
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="Comentário (opcional)"
                        style={textarea}
                    />
                    <button disabled={busy} onClick={submit} style={btnPrimary}>
                        {busy ? "Salvando…" : "Salvar avaliação"}
                    </button>
                </div>
            )}

            {ratings.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 950 }}>Últimos comentários</div>
                    {ratings.slice(0, 6).map((r) => (
                        <div key={r.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ fontWeight: 900, color: "#0f172a" }}>{r.userEmail || "Usuário"}</div>
                                <div style={{ fontWeight: 900 }}>{renderStars(r.stars || 0)}</div>
                            </div>
                            {r.comment ? <div style={{ color: "#334155", fontWeight: 700, marginTop: 6 }}>{r.comment}</div> : null}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function renderStars(n) {
    const v = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return "★".repeat(v) + "☆".repeat(5 - v);
}

function StarsDisplay({ value }) {
    const v = Math.max(0, Math.min(5, value || 0));
    const full = Math.floor(v);
    return (
        <div style={{ fontWeight: 900, letterSpacing: 1 }}>
            {"★".repeat(full)}
            {"☆".repeat(5 - full)}
        </div>
    );
}

function StarsPicker({ value, onChange }) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    onClick={() => onChange?.(n)}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: n <= value ? "rgba(250,204,21,0.35)" : "#fff",
                        fontWeight: 950,
                        cursor: "pointer",
                    }}
                >
                    {n}★
                </button>
            ))}
        </div>
    );
}

const textarea = {
    width: "100%",
    minHeight: 90,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    padding: "12px 14px",
    fontWeight: 700,
    outline: "none",
    background: "#fff",
    resize: "vertical",
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
