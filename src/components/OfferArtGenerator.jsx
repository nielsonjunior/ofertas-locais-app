import React, { useState } from "react";
import { generateOfferArt } from "../utils/generateOfferArt";

export default function OfferArtGenerator({ variantDefault = "light", onGenerated }) {
    const [title, setTitle] = useState("Coca-Cola 2L");
    const [price, setPrice] = useState("5,99");
    const [oldPrice, setOldPrice] = useState("7,49");
    const [marketName, setMarketName] = useState("Supermercado São João");
    const [cityName, setCityName] = useState("São Paulo");
    const [category, setCategory] = useState("bebidas");
    const [discountLabel, setDiscountLabel] = useState("20% OFF");
    const [variant, setVariant] = useState(variantDefault);
    const [previewUrl, setPreviewUrl] = useState("");

    async function handleGenerate() {
        const blob = await generateOfferArt({
            title,
            price,
            oldPrice,
            marketName,
            cityName,
            category,
            discountLabel,
            variant,
        });

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        onGenerated?.(blob, {
            title,
            price,
            oldPrice,
            marketName,
            cityName,
            category,
            discountLabel,
            variant,
        });
    }

    return (
        <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <div style={{ display: "grid", gap: 8 }}>
                <label>Nome do produto</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                    <label>Preço</label>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                    <label>Preço antigo</label>
                    <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} />
                </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
                <label>Mercado</label>
                <input value={marketName} onChange={(e) => setMarketName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
                <label>Cidade</label>
                <input value={cityName} onChange={(e) => setCityName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                    <label>Categoria</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="hortifruti">Hortifruti</option>
                        <option value="carnes">Carnes</option>
                        <option value="bebidas">Bebidas</option>
                        <option value="laticinios">Laticínios</option>
                        <option value="limpeza">Limpeza</option>
                        <option value="padaria">Padaria</option>
                        <option value="congelados">Congelados</option>
                        <option value="mercearia">Mercearia</option>
                        <option value="pet">Pet</option>
                        <option value="outros">Outros</option>
                    </select>
                </div>

                <div>
                    <label>Modo</label>
                    <select value={variant} onChange={(e) => setVariant(e.target.value)}>
                        <option value="light">Home (claro)</option>
                        <option value="dark">Swipe (dark)</option>
                    </select>
                </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
                <label>Selo (opcional)</label>
                <input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="Ex: 20% OFF" />
            </div>

            <button onClick={handleGenerate} style={{ padding: 12, borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 900 }}>
                Gerar imagem
            </button>

            {previewUrl && (
                <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <img src={previewUrl} alt="preview" style={{ width: "100%", display: "block" }} />
                </div>
            )}
        </div>
    );
}
