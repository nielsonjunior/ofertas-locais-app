export function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", (e) => reject(e));
        img.crossOrigin = "anonymous";
        img.src = url;
    });
}

export async function getCroppedBlob(imageSrc, cropPixels, { width = 1080, height = 1350, type = "image/png", quality = 0.92 } = {}) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // cropPixels: { x, y, width, height } no espaço da imagem original
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        width,
        height
    );

    return await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality);
    });
}
