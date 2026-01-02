import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadFileToStorage(file, { marketId, offerId, variant = "light" }) {
    const storage = getStorage();
    const ext = (file.name || "jpg").split(".").pop() || "jpg";
    const path = `offers/${marketId}/${offerId}/upload_${variant}_${Date.now()}.${ext}`;
    const fileRef = ref(storage, path);

    await uploadBytes(fileRef, file, {
        contentType: file.type || "image/jpeg",
        cacheControl: "public, max-age=31536000",
    });

    const url = await getDownloadURL(fileRef);
    return { url, path };
}
