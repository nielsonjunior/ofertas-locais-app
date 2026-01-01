import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';

const COLLECTION_NAME = 'products_memory';

/**
 * Normalizes a product name for consistent storage/retrieval
 * e.g., "iPhone 13 Pro Max" -> "iphone 13 pro max"
 */
const normalizeTerm = (term) => {
    return term.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^\w\s]/g, '') // Remove special chars
        .trim();
};

/**
 * Generates keywords for fuzzy matching
 */
const generateKeywords = (term) => {
    return normalizeTerm(term).split(' ').filter(w => w.length > 2);
};

/**
 * Searches for a product in the memory bank (Firestore)
 */
export const findProductInMemory = async (searchTerm) => {
    try {
        const normalizedSearch = normalizeTerm(searchTerm);
        const keywords = generateKeywords(searchTerm);

        if (keywords.length === 0) return null;

        const productsRef = collection(db, COLLECTION_NAME);

        // Strategy: Find any product that contains at least one of the main keywords
        // Note: Firestore array-contains-any is limited to 10 items
        const mainKeyword = keywords[0];

        // Ideally we would use full-text search (Algolia/Typesense) but for this logic
        // we will try to match exact normalized name OR use client-side filtering on a subset
        // For simplicity and cost, let's look for exact matches on normalizedName first

        const q = query(
            productsRef,
            where('normalizedName', '==', normalizedSearch),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            // Update usage stats
            await updateDoc(doc(db, COLLECTION_NAME, querySnapshot.docs[0].id), {
                usageCount: (docData.usageCount || 0) + 1,
                lastUsed: Timestamp.now()
            });
            console.log(`[Memory] Hit found for "${searchTerm}"`);
            return docData.data;
        }

        // --- FUZZY FALLBACK (Optional - can be expanded later) ---
        // For now, strict match on normalized string is safer to avoid bad "memories"

        console.log(`[Memory] No hit for "${searchTerm}"`);
        return null;

    } catch (error) {
        console.error("Error searching product memory:", error);
        return null;
    }
};

/**
 * Saves a high-confidence product result to memory
 */
export const saveProductToMemory = async (searchTerm, productData) => {
    try {
        if (!productData || !productData.title) return;

        const normalizedName = normalizeTerm(searchTerm);
        const keywords = generateKeywords(searchTerm);

        // Check availability before saving to prevent duplicates
        const existing = await findProductInMemory(searchTerm);
        if (existing) return;

        await addDoc(collection(db, COLLECTION_NAME), {
            normalizedName: normalizedName,
            originalTerm: searchTerm,
            keywords: keywords,
            data: productData,
            usageCount: 1,
            createdAt: Timestamp.now(),
            lastUsed: Timestamp.now()
        });

        console.log(`[Memory] Saved "${searchTerm}" to knowledge base.`);

    } catch (error) {
        console.error("Error saving product to memory:", error);
    }
};
