const KEY = "ofertas_favorites_v1";

export function getFavorites() {
    try {
        const raw = localStorage.getItem(KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function isFavorite(offerId) {
    return getFavorites().includes(offerId);
}

export function toggleFavorite(offerId) {
    const favs = new Set(getFavorites());
    if (favs.has(offerId)) favs.delete(offerId);
    else favs.add(offerId);
    const arr = Array.from(favs);
    localStorage.setItem(KEY, JSON.stringify(arr));
    return arr;
}
