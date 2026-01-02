import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadBlobToStorage(blob, { marketId, offerId, variant = "light" }) {
    const storage = getStorage();
    const path = `offers/${marketId}/${offerId}/cover_${variant}_${Date.now()}.png`;
    const fileRef = ref(storage, path);

    await uploadBytes(fileRef, blob, {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000",
    });

    const url = await getDownloadURL(fileRef);
    return { url, path };
}
