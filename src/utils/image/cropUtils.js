export function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", (e) => reject(e));
        img.crossOrigin = "anonymous";
        img.src = url;
    });
}

export async function getCroppedBlob(imageSrc, cropPixels, outW, outH, type = "image/jpeg", quality = 0.92) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context missing");

    // cropPixels = { x, y, width, height }
    // desenha somente a área cropada no canvas final
    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        outW,
        outH
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Canvas failure"));
            resolve(blob);
        }, type, quality);
    });
}
