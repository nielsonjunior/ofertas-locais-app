import React, { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "../utils/imageCropper";

export default function ImageCropModal({
    open,
    file,
    aspect = 1080 / 1350,
    onClose,
    onDone,
}) {
    const [imageSrc, setImageSrc] = useState("");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPixels, setCroppedPixels] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!file) return setImageSrc("");
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const onCropComplete = useCallback((_, croppedAreaPixels) => {
        setCroppedPixels(croppedAreaPixels);
    }, []);

    async function handleDone() {
        if (!imageSrc || !croppedPixels) return;
        setBusy(true);
        try {
            const blob = await getCroppedBlob(imageSrc, croppedPixels, { width: 1080, height: 1350, type: "image/png" });
            onDone?.(blob);
        } catch (e) {
            alert(e?.message || "Erro ao recortar imagem");
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div style={backdrop}>
            <div style={panel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 950 }}>Ajustar imagem</div>
                    <button onClick={onClose} style={btnGhost}>Fechar</button>
                </div>

                <div style={cropArea}>
                    {imageSrc ? (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            restrictPosition={false}
                        />
                    ) : null}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontWeight: 900 }}>Zoom</label>
                    <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.01"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                        <button onClick={onClose} style={btnGhost}>Cancelar</button>
                        <button onClick={handleDone} style={btnPrimary} disabled={busy}>
                            {busy ? "Salvando…" : "Usar imagem"}
                        </button>
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
                        Arraste para reposicionar e use o zoom para enquadrar (igual iPhone).
                    </div>
                </div>
            </div>
        </div>
    );
}

const backdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 12,
};

const panel = {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    display: "grid",
    gap: 12,
};

const cropArea = {
    position: "relative",
    width: "100%",
    height: 420,
    background: "#0b0f14",
    borderRadius: 16,
    overflow: "hidden",
};

const btnGhost = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
};

const btnPrimary = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "none",
    background: "#FACC15",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
};
