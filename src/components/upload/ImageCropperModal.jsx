import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "../../utils/image/cropUtils";
import normalizeImage from "../../utils/image/normalizeImage";
import "../../styles/app.css"; // Ensure styles are available

// Gera ambos formatos (Square 1:1 e Story 9:16)
// A estratégia “iOS Simples”:
// O usuário ajusta o Zoom e Posição UMA vez vendo o quadrado ou vertical (aqui vamos focar no vertical pois é maior).
// Na hora de salvar, cortamos o centro.
// Ou melhor: forçamos o usuário a cortar 1:1 e depois 9:16?
// O pedido foi: "Simple crop/zoom tipo iOS".
// Vamos usar um crop retangular que permita enquadrar o produto.
// Para garantir qualidade, vamos pedir ao usuário para enquadrar no formato 1:1 (principal para feed)
// E automaticamente extraímos 9:16 expandindo... não, isso pode cortar errado ou faltar imagem.
//
// MELHOR UX:
// Crop fixo 9:16 (Story). O 1:1 (Square) será o CENTRO desse 9:16.
// Assim garantimos que o produto esteja no meio.
// A imagem do grid (1:1) é apenas um recorte central da imagem Full (9:16).

const ASPECT_STORY = 9 / 16;
const SIZE_W = 1080;
const SIZE_H = 1920;

export default function ImageCropperModal({ open, file, onClose, onComplete }) {
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [busy, setBusy] = useState(false);

    // Carrega arquivo
    React.useEffect(() => {
        if (file && open) {
            normalizeImage(file).then(setImageSrc).catch(console.error);
        } else {
            setImageSrc(null);
        }
    }, [file, open]);

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    async function handleSave() {
        if (!imageSrc || !croppedAreaPixels) return;
        setBusy(true);
        try {
            // 1) Gerar Story (9:16) Full
            const storyBlob = await getCroppedBlob(
                imageSrc,
                croppedAreaPixels,
                SIZE_W,
                SIZE_H,
                "image/jpeg",
                0.92
            );

            // 2) Gerar Square (1:1) - Cortando o centro do render 9:16?
            // Melhor: calcular pixels relativos para 1:1 baseados no zoom atual?
            // Simplificação "iOS": Cortar o centro Exato do storyBlob gerado?
            // Não, isso requer re-ler o blob.
            //
            // Vamos usar o PRÓPRIO CROPPER para gerar o 1:1 também.
            // O crop 9:16 seleciona uma área H.
            // A área 1:1 deve ter mesma largura W e altura W, centralizada na área H.
            // pixels: { x, y, width, height } -> isso é o 9:16
            // centerW = pixels.width
            // centerH = pixels.width (quadrado)
            // centerY = pixels.y + (pixels.height - centerH) / 2
            //
            // Cuidado: se o usuário deu zoom máximo onde não cabe, pode dar ruim.
            // Mas assumindo fit:

            const squarePixels = {
                x: croppedAreaPixels.x,
                y: croppedAreaPixels.y + (croppedAreaPixels.height - croppedAreaPixels.width) / 2, // centro vertical do crop
                width: croppedAreaPixels.width,
                height: croppedAreaPixels.width
            };

            // Se squarePixels sair da imagem (topo ou base), ajustamos?
            // O react-easy-crop limita o bounds.
            // Na prática, se o user selecionar o topo da imagem, o centro 1:1 vai cair mais pra baixo...
            // Vamos tentar essa heurística. Se ficar ruim, o user ajusta.

            const squareBlob = await getCroppedBlob(
                imageSrc,
                squarePixels,
                1080,
                1080,
                "image/jpeg",
                0.92
            );

            const previewSquare = URL.createObjectURL(squareBlob);
            const previewStory = URL.createObjectURL(storyBlob);

            onComplete({
                squareBlob,
                storyBlob,
                previewSquare,
                previewStory
            });
            onClose();
        } catch (e) {
            alert("Erro ao cortar imagem");
            console.error(e);
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div className="modalBackdrop">
            <div className="modal">
                <div className="modalHeader">
                    <span style={{ fontWeight: 900, fontSize: 18 }}>Ajustar Imagem</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24 }}>&times;</button>
                </div>

                <div className="modalBody">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={ASPECT_STORY}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            showGrid={true}
                        />
                    )}
                </div>

                <div className="modalFooter" style={{ flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
                        <span>Zoom</span>
                        <span>Enquadre o produto no centro</span>
                    </div>

                    <input
                        type="range"
                        min={1} max={3} step={0.05}
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        style={{ width: '100%', marginBottom: 14 }}
                    />

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btnGhost" onClick={onClose}>Cancelar</button>
                        <button className="btnPrimary" onClick={handleSave} disabled={busy}>
                            {busy ? "Salvando..." : "Usar Imagem"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
