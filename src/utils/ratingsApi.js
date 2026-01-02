import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export async function upsertRating(offerId, user, { stars, comment }) {
    const db = getFirestore();
    const ref = doc(db, "offers", offerId, "ratings", user.uid);

    await setDoc(
        ref,
        {
            userId: user.uid,
            userEmail: user.email || null,
            stars: Number(stars),
            comment: String(comment || "").slice(0, 500),
            createdAt: serverTimestamp(),
        },
        { merge: true }
    );
}

export async function getMyRating(offerId, userId) {
    const db = getFirestore();
    const ref = doc(db, "offers", offerId, "ratings", userId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

export async function listRatings(offerId, max = 20) {
    const db = getFirestore();
    const q = query(collection(db, "offers", offerId, "ratings"), orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
