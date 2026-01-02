import React, { useState } from "react";
import { createOffer } from "../../utils/offersApi";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useCity } from "../../context/CityContext"; // Auto-fill city

const STEPS = ["Dados Básicos", "Preço & Detalhes", "Revisão"];

export default function MerchantCreateTab({ onFinish }) {
    const { profile } = useUserProfile();
    const { city: globalCity } = useCity();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        category: "Restaurante", // Default
        price: "",
        oldPrice: "",
        description: "",
        city: globalCity || "Sorocaba",
    });

    const handleChange = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

    async function handleSubmit() {
        setLoading(true);
        try {
            await createOffer({
                ...form,
                merchantId: profile?.uid,
                storeName: profile?.displayName || "Minha Loja", // Fallback
                storeAddress: "Endereço da Loja", // Should come from profile
                status: "active",
                views: 0
            });
            onFinish();
        } catch (e) {
            alert("Erro ao criar oferta: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 20 }}>
            {/* Wizard Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{
                        fontWeight: 800,
                        opacity: i === step ? 1 : 0.4,
                        color: i === step ? "#ef4444" : "#000",
                        fontSize: 14
                    }}>
                        {i + 1}. {s}
                    </div>
                ))}
            </div>

            {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <label>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Título do Anúncio</div>
                        <input
                            value={form.title}
                            onChange={e => handleChange("title", e.target.value)}
                            placeholder="Ex: Combo X-Burger"
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ccc" }}
                        />
                    </label>

                    <label>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Categoria</div>
                        <select
                            value={form.category}
                            onChange={e => handleChange("category", e.target.value)}
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ccc" }}
                        >
                            {["Restaurante", "Mercado", "Farmácia", "Eletrônicos", "Moda", "Serviços", "Outros"].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Cidade</div>
                        <input
                            value={form.city}
                            onChange={e => handleChange("city", e.target.value)}
                            placeholder="Cidade"
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ccc" }}
                        />
                    </label>

                    <button
                        disabled={!form.title}
                        onClick={() => setStep(1)}
                        style={{ marginTop: 10, padding: 16, background: "#111", color: "#fff", fontWeight: 800, borderRadius: 12, border: "none" }}
                    >
                        Próximo
                    </button>
                </div>
            )}

            {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <label>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Preço (R$)</div>
                        <input
                            type="number"
                            value={form.price}
                            onChange={e => handleChange("price", e.target.value)}
                            placeholder="0.00"
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ccc" }}
                        />
                    </label>

                    <label>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Preço Original (opcional)</div>
                        <input
                            type="number"
                            value={form.oldPrice}
                            onChange={e => handleChange("oldPrice", e.target.value)}
                            placeholder="Para mostrar desconto (de R$ X por Y)"
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ccc" }}
                        />
                    </label>

                    <label>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Descrição</div>
                        <textarea
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            placeholder="Detalhes do produto..."
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ccc", minHeight: 100 }}
                        />
                    </label>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setStep(0)} style={{ flex: 1, padding: 16, background: "#f3f4f6", fontWeight: 800, borderRadius: 12, border: "none" }}>Voltar</button>
                        <button onClick={() => setStep(2)} style={{ flex: 2, padding: 16, background: "#111", color: "#fff", fontWeight: 800, borderRadius: 12, border: "none" }}>Revisar</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Resumo do Anúncio</h3>
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                            <div><b>Título:</b> {form.title}</div>
                            <div><b>Categoria:</b> {form.category}</div>
                            <div><b>Preço:</b> R$ {form.price} {form.oldPrice ? `(era ${form.oldPrice})` : ""}</div>
                            <div><b>Cidade:</b> {form.city}</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setStep(1)} style={{ flex: 1, padding: 16, background: "#f3f4f6", fontWeight: 800, borderRadius: 12, border: "none" }}>Voltar</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: 16, background: "#ef4444", color: "#fff", fontWeight: 800, borderRadius: 12, border: "none" }}>
                            {loading ? "Publicando..." : "Publicar Agora"}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
