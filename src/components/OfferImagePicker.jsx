import React, { useState } from "react";
import OfferArtGenerator from "./OfferArtGenerator";
import ImageCropModal from "./ImageCropModal";

export default function OfferImagePicker({ onChange }) {
    const [tab, setTab] = useState("upload"); // upload | generate

    const [pickedFile, setPickedFile] = useState(null);
    const [cropOpen, setCropOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    function emit(payload) {
        onChange?.(payload);
    }

    return (
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 14, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
                <Tab label="Upload" active={tab === "upload"} onClick={() => setTab("upload")} />
                <Tab label="Gerar arte" active={tab === "generate"} onClick={() => setTab("generate")} />
            </div>

            {tab === "upload" ? (
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 950 }}>Enviar foto do produto (manual)</div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (!f) return;

                            setPickedFile(f);
                            setCropOpen(true);
                        }}
                    />

                    {previewUrl ? (
                        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <img src={previewUrl} alt="preview" style={{ width: "100%", display: "block" }} />
                        </div>
                    ) : (
                        <div style={{ color: "#475569", fontWeight: 800 }}>
                            Se a imagem estiver torta, grande ou pequena, vamos ajustar no editor.
                        </div>
                    )}

                    <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
                        Você poderá dar zoom e recortar para ficar no padrão (1080x1350).
                    </div>

                    <ImageCropModal
                        open={cropOpen}
                        file={pickedFile}
                        onClose={() => setCropOpen(false)}
                        onDone={(blob) => {
                            setCropOpen(false);
                            const url = URL.createObjectURL(blob);
                            setPreviewUrl(url);

                            // já padronizado: mesma imagem para light/dark
                            emit({ mode: "upload", light: blob, dark: blob });
                        }}
                    />
                </div>
            ) : null}

            {tab === "generate" ? (
                <div style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontWeight: 950 }}>Gerar imagens automáticas (Home claro e Swipe dark)</div>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                        <div>
                            <div style={{ fontWeight: 900, marginBottom: 8 }}>Capa Home (claro)</div>
                            <OfferArtGenerator
                                variantDefault="light"
                                onGenerated={(blob) => emit({ mode: "generated", light: blob, dark: null })}
                            />
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, marginBottom: 8 }}>Capa Swipe (dark)</div>
                            <OfferArtGenerator
                                variantDefault="dark"
                                onGenerated={(blob) => emit({ mode: "generated", light: null, dark: blob })}
                            />
                        </div>
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
                        Gere as duas capas para ficar perfeito no A+B.
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function Tab({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.10)",
                background: active ? "rgba(0,0,0,0.06)" : "#fff",
                fontWeight: 950,
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}
