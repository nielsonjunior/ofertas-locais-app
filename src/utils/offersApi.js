import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { db } from "../firebase";

// Util: format data simples (sem libs)
function formatDateBR(date) {
    try {
        return new Intl.DateTimeFormat("pt-BR").format(date);
    } catch {
        return "";
    }
}

// ✅ FEED por cidade + categorias
// REMOVIDO "orderBy" das queries compostas para evitar erro de índice no Firestore.
// A ordenação será feita no cliente (array.sort).
export async function fetchOffersFeed({ city, categories } = {}) {
    const cat = Array.isArray(categories) ? categories.filter(Boolean) : [];
    const useIn = cat.length > 0 && cat.length <= 10;

    let q;
    try {
        if (city && useIn) {
            // Query composta: city == X AND category IN [...]
            // Se adicionar orderBy('createdAt') aqui, precisa de índice composto. 
            // Vamos buscar sem ordem e ordenar no front.
            q = query(
                collection(db, "offers"),
                where("city", "==", city),
                where("category", "in", cat)
            );
        } else if (city && !useIn) {
            q = query(
                collection(db, "offers"),
                where("city", "==", city)
            );
        } else if (!city && useIn) {
            q = query(
                collection(db, "offers"),
                where("category", "in", cat)
            );
        } else {
            // Sem filtros, pode usar orderBy e limit
            // Mas se tiver muita oferta mixed, melhor ordenar tudo no front ou garantir índice simples.
            // Firestore default orders by ID se não especificar.
            q = query(collection(db, "offers"));
        }

        const snap = await getDocs(q);
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filtragem extra se categories > 10
        if (city && !useIn && cat.length) {
            data = data.filter((o) => cat.includes(o.category));
        }

        // Ordenação Client-Side (Mais novos primeiro)
        data.sort((a, b) => {
            const tA = a.createdAt?.seconds || 0;
            const tB = b.createdAt?.seconds || 0;
            return tB - tA;
        });

        // Limite manual (já que tiramos o limit da query para garantir sort correto)
        data = data.slice(0, 100);

        // textinho de validade (se existir)
        data = data.map((o) => {
            let expiresAtText = "";
            if (o.expiresAt?.toDate) {
                expiresAtText = formatDateBR(o.expiresAt.toDate());
            }
            return { ...o, expiresAtText };
        });

        return data;

    } catch (err) {
        console.error("Erro ao buscar ofertas:", err);
        throw err;
    }
}

// -------------------- CRUD LOJISTA --------------------

export async function fetchMyOffers(merchantId) {
    if (!merchantId) return [];
    // Aqui geralmente funciona index simples, mas se falhar, tiramos o orderBy também
    try {
        const q = query(
            collection(db, "offers"),
            where("merchantId", "==", merchantId)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Sort client side
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        return data;
    } catch (e) {
        console.error("Erro fetchMyOffers", e);
        return [];
    }
}

export async function getOfferById(id) {
    const ref = doc(db, "offers", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function createOffer(payload) {
    const ref = await addDoc(collection(db, "offers"), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateOffer(id, payload) {
    const ref = doc(db, "offers", id);
    await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
}

export async function setOfferStatus(id, status) {
    const ref = doc(db, "offers", id);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

export async function removeOffer(id) {
    const ref = doc(db, "offers", id);
    await deleteDoc(ref);
}
