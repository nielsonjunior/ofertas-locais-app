// Simples wrapper para garantir que temos uma URL válida antes do crop
export async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Por enquanto, apenas retorna o dataURL.
// Se precisar rotacionar imagens (EXIF) no futuro, adicione aqui.
export default async function normalizeImage(file) {
    if (!file) throw new Error("Arquivo vazio");
    return readFileAsDataURL(file);
}
