import axios from 'axios';
import { searchConfig } from '../config/searchConfig';
import { findProductInMemory, saveProductToMemory } from './productMemoryService';

const GOOGLE_API_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * Smart Product Search Service (Generation 3)
 * "The Coherent Product Generator"
 * Now with Semantic Validation & Stock Image Blocking & MEMORY
 */
export const searchProductSmart = async (originalQuery) => {
    if (!originalQuery) return null;

    // 0. MEMORY CHECK: Do we already know this product?
    const memoryResult = await findProductInMemory(originalQuery);
    if (memoryResult) {
        console.log("Returned from Memory Cache 🧠");
        return memoryResult;
    }

    if (searchConfig.apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
        console.warn("Google API Key not configured. Using Mock Data.");
        return mockSearch(originalQuery);
    }

    // 1. INTENT REFORMULATION
    const refinedQuery = reformulateQuery(originalQuery);
    console.log(`Smart Search Query: "${refinedQuery}"`);

    try {
        const response = await axios.get(GOOGLE_API_URL, {
            params: {
                key: searchConfig.apiKey,
                cx: searchConfig.searchEngineId,
                q: refinedQuery,
                num: 8,
                gl: 'br',
                hl: 'pt',
                safe: 'active'
            }
        });

        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }

        // 2. SELECTION ENGINE WITH SEMANTIC VALIDATION
        const bestMatch = pickBestResult(response.data.items, originalQuery);

        // 3. MEMORY OPTIMIZATION: If result is excellent, learn it.
        // We re-calculate score roughly here or rely on the fact pickBestResult returns valid item
        if (bestMatch) {
            // We can fire-and-forget the save to avoid blocking UI
            saveProductToMemory(originalQuery, bestMatch);
        }

        return bestMatch;

    } catch (error) {
        console.error("Smart Product Search failed:", error);
        throw error;
    }
};

const reformulateQuery = (query) => {
    const cleanQuery = query.replace(/[^\w\s\u00C0-\u00FF]/gi, ' ').trim();
    const shoppingContext = "(comprar OR preço OR oferta OR venda OR loja)";
    const exclusions = "-download -apk -grátis -torrent -crack -login -entrar -suporte -driver -manual -pdf -receita -significado -wiki -estoque -vetor -ilustração";
    return `"${cleanQuery}" ${shoppingContext} ${exclusions}`;
};

const pickBestResult = (items, originalKeyword) => {
    // Breakdown keywords for semantic scoring
    const queryKeywords = originalKeyword.toLowerCase().
        replace(/[^\w\s]/gi, '').
        split(' ').
        filter(w => w.length > 2 && !['com', 'para', 'que', 'dos', 'das'].includes(w));

    const scoredItems = items.map(item => {
        let score = 0;
        const normalizedTitle = item.title.toLowerCase();
        const extracted = extractDataFromItem(item);

        // --- FILTER 1: SEMANTIC COHERENCE (MANDATORY) ---
        // Does the title actually contain the user's search terms?
        const semanticScore = calculateSemanticScore(normalizedTitle, queryKeywords);
        if (semanticScore < 0.4) {
            score -= 200; // REJECT: Title doesn't match query (e.g. "Case" for "iPhone")
        } else {
            score += (semanticScore * 50); // Boost by relevance
        }

        // --- FILTER 2: IMAGE VALIDATION ---
        if (!extracted.image) {
            score -= 100;
        } else {
            // Stock Image Check
            if (isStockImage(extracted.image) || isStockImage(item.displayLink)) {
                score -= 1000; // REJECT: Stock images are not products
            }

            // Quality Check
            const issues = validateImage(extracted.image, extracted.imageDimensions);
            if (issues.length === 0) {
                score += 30;
            } else {
                score -= 20;
            }
        }

        // --- FILTER 3: COMMERCIAL INTENT ---
        if (extracted.price) score += 40;
        if (isMarketplace(item.displayLink)) score += 20;
        if (isBadDomain(item.displayLink)) score -= 200;

        // --- FILTER 4: ANTI-BLOG ---
        if (normalizedTitle.includes('review') || normalizedTitle.includes('análise') || normalizedTitle.includes('blog') ||
            normalizedTitle.startsWith('quanto') || normalizedTitle.startsWith('como') || normalizedTitle.startsWith('qual') ||
            normalizedTitle.startsWith('o que') ||
            normalizedTitle.includes('lançamento') || normalizedTitle.includes('especulações')) {
            score -= 100;
        }

        return { item: extracted, score };
    });

    // Sort by score
    scoredItems.sort((a, b) => b.score - a.score);
    console.log("Scored Candidates:", scoredItems.map(s => `[${s.score}] ${s.item.title}`));

    // Threshold: Must be positive to be valid
    if (scoredItems.length > 0 && scoredItems[0].score > 0) {
        return scoredItems[0].item;
    }

    // Fallback: None
    return null;
};

const calculateSemanticScore = (title, queryKeywords) => {
    if (queryKeywords.length === 0) return 1;
    let matches = 0;
    queryKeywords.forEach(word => {
        if (title.includes(word)) matches++;
    });
    return matches / queryKeywords.length; // 0.0 to 1.0
};

const isStockImage = (url) => {
    const stockDomains = [
        'gettyimages', 'shutterstock', 'istockphoto', 'adobe', 'freepik',
        'vecteezy', 'dreamstime', '123rf', 'alamy', 'depositphotos', 'unsplash', 'pexels', 'pixabay'
    ];
    return stockDomains.some(d => url.toLowerCase().includes(d));
};

const extractDataFromItem = (item) => {
    const pagemap = item.pagemap || {};

    let data = {
        title: cleanTitle(item.title),
        link: item.link,
        source: item.displayLink,
        image: null,
        imageDimensions: { width: 0, height: 0 },
        price: null,
        storeName: item.displayLink, // legacy
        description: cleanSnippet(item.snippet),
        imageUrl: null // legacy
    };

    if (pagemap.cse_image && pagemap.cse_image.length > 0) {
        const img = pagemap.cse_image[0];
        data.image = img.src;
        if (img.width) data.imageDimensions.width = parseInt(img.width);
        if (img.height) data.imageDimensions.height = parseInt(img.height);
    }
    else if (pagemap.og_image && pagemap.og_image.length > 0) {
        data.image = pagemap.og_image[0];
    }
    data.imageUrl = data.image;

    if (pagemap.metatags && pagemap.metatags.length > 0) {
        const meta = pagemap.metatags[0];
        if (meta['product:price:amount']) data.price = meta['product:price:amount'];
        else if (meta['og:price:amount']) data.price = meta['og:price:amount'];
        else if (meta['price']) data.price = meta['price'];
    }
    if (!data.price && pagemap.offer && pagemap.offer.length > 0) {
        if (pagemap.offer[0].price) data.price = pagemap.offer[0].price;
    }

    return data;
};

const validateImage = (url, dim) => {
    const issues = [];
    if (!url) return ['missing'];
    const lower = url.toLowerCase();

    if (lower.includes('logo') || lower.includes('icon') || lower.includes('nav') || lower.includes('banner')) issues.push('keyword');

    if (dim.width > 0 && dim.height > 0) {
        if (dim.width < 250 || dim.height < 250) issues.push('too_small');
        const aspect = dim.width / dim.height;
        if (aspect > 2.5 || aspect < 0.4) issues.push('bad_aspect_ratio');
    }
    return issues;
};

const isMarketplace = (domain) => {
    const markets = ['mercadolivre', 'amazon', 'magazineluiza', 'shopee', 'americanas', 'casasbahia', 'submarino', 'shop', 'store', 'loja', 'ponto', 'extra', 'kalunga', 'kabum'];
    return markets.some(m => domain.includes(m));
};

const isBadDomain = (domain) => {
    const bad = ['youtube', 'wikipedia', 'facebook', 'instagram', 'twitter', 'linkedin', 'globo.com', 'uol.com.br', 'tech', 'tudocelular', 'tecnoblog'];
    return bad.some(b => domain.includes(b));
};

const cleanTitle = (title) => {
    return title.split(' - ')[0].split(' | ')[0].trim();
};

const cleanSnippet = (snippet) => {
    if (!snippet) return '';
    let clean = snippet
        .replace(/R\$\s?[\d.,]+/g, '')
        .replace(/\b(frete|grátis|entrega|envio|compre|comprar|loja|oferta|desconto|parcele|juros|cartão|pagamento|estoque|confira)\b.*?([.,]|$)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    return clean;
};

const mockSearch = (query) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                title: `${query} (Resultado Validado)`,
                image: "https://via.placeholder.com/600x600?text=Produto+Real",
                imageUrl: "https://via.placeholder.com/600x600?text=Produto+Real",
                price: "159,90",
                link: "https://loja.com/produto",
                source: "Loja Exemplo",
                storeName: "Loja Exemplo",
                description: "Descrição limpa do produto validado semanticamente."
            });
        }, 1200);
    });
};
