/**
 * Image Search Service
 * Handles searching for product images via Google Custom Search API.
 * 
 * Requires:
 * 1. VITE_GOOGLE_API_KEY (Provided)
 * 2. VITE_GOOGLE_SEARCH_ENGINE_ID (CX) - Required from Programmable Search Engine
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
const GOOGLE_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

export const searchProductImages = async (query) => {
    if (!query) return [];

    // Check configuration
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID || GOOGLE_SEARCH_ENGINE_ID.includes('YOUR_SEARCH_ENGINE_ID')) {
        console.warn("Google API Configuration missing (Key or CX). Returning mock data.");

        // Mock Fallback
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            {
                id: 'mock-1',
                thumbnailUrl: `https://loremflickr.com/320/240/${encodeURIComponent(query)}?lock=10`,
                contentUrl: `https://loremflickr.com/800/600/${encodeURIComponent(query)}?lock=10`,
                title: `${query} (Demo - Falta ID do Buscador)`,
                source: 'Configure o CX no .env'
            },
            {
                id: 'mock-2',
                thumbnailUrl: `https://loremflickr.com/320/240/${encodeURIComponent(query)}?lock=11`,
                contentUrl: `https://loremflickr.com/800/600/${encodeURIComponent(query)}?lock=11`,
                title: `${query} (Demo)`,
                source: 'Configure o CX no .env'
            }
        ];
    }

    try {
        const url = `${GOOGLE_ENDPOINT}?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=10&safe=active`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Google API Error:", errorData);
            throw new Error('Falha na busca do Google');
        }

        const data = await response.json();

        if (!data.items) return [];

        return data.items.map((item, index) => ({
            id: index,
            thumbnailUrl: item.image.thumbnailLink,
            contentUrl: item.link,
            title: item.title,
            source: item.displayLink
        }));

    } catch (error) {
        console.error("Image search failed:", error);
        return [];
    }
};
