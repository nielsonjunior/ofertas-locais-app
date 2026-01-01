
/**
 * Image Processor Utility
 * Standardizes images to ensure perfect fit across devices.
 * 
 * Strategy:
 * 1. Resizes to fixed dimension (default 800x600 - 4:3 aspect ratio).
 * 2. Adds white background.
 * 3. Centers the image with "contain" logic (letterboxing).
 * 4. Converts to high-quality JPEG.
 */

export const processImageForUpload = (fileOrUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Target Dimensions (4:3 Standard)
        const TARGET_WIDTH = 800;
        const TARGET_HEIGHT = 600;

        // Load image from File object or URL string
        if (typeof fileOrUrl === 'string') {
            img.src = fileOrUrl;
            img.crossOrigin = "Anonymous"; // Allow cross-origin for search results
        } else if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
            img.src = URL.createObjectURL(fileOrUrl);
        } else {
            reject(new Error("Invalid input provided to image processor"));
            return;
        }

        img.onload = () => {
            // Set canvas size
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;

            // Fill background with white
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

            // Calculate "contain" fit
            const scale = Math.min(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
            const x = (TARGET_WIDTH / 2) - (img.width / 2) * scale;
            const y = (TARGET_HEIGHT / 2) - (img.height / 2) * scale;

            // Draw image centered
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Export as Blob (JPEG 90% quality)
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create a File object from the Blob to mimic distinct upload
                    const processedFile = new File([blob], "processed_image.jpg", {
                        type: "image/jpeg",
                        lastModified: Date.now()
                    });

                    // Also return a preview URL
                    const previewUrl = URL.createObjectURL(blob);

                    resolve({ file: processedFile, previewUrl });
                } else {
                    reject(new Error("Canvas export failed"));
                }
            }, 'image/jpeg', 0.9);
        };

        img.onerror = (err) => {
            console.error("Image loading failed during processing", err);
            reject(new Error("Failed to load image for processing"));
        };
    });
};
