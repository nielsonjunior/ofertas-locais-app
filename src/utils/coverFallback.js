const CATEGORY_COLORS = {
    Hortifruti: ["#22c55e", "#16a34a"],
    Carnes: ["#ef4444", "#b91c1c"],
    Bebidas: ["#3b82f6", "#1d4ed8"],
    "Laticínios": ["#60a5fa", "#2563eb"],
    Limpeza: ["#a78bfa", "#7c3aed"],
    Padaria: ["#f59e0b", "#d97706"],
    Congelados: ["#38bdf8", "#0ea5e9"],
    Mercearia: ["#94a3b8", "#334155"],
    default: ["#60a5fa", "#2563eb"],
};

function esc(s) {
    return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function pickColors(category) {
    const key = Object.keys(CATEGORY_COLORS).find((k) => k.toLowerCase() === String(category || "").toLowerCase());
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

// retorna URL final para usar no <img src=...>
export function getCoverUrl(offer, variant = "light") {
    const stored =
        offer?.images?.[variant === "dark" ? "coverDarkUrl" : "coverLightUrl"] ||
        offer?.images?.coverLightUrl ||
        offer?.images?.coverDarkUrl ||
        offer?.coverImageUrl ||
        "";

    if (stored) return stored;

    const title = esc(offer?.title || "Oferta");
    const category = offer?.category || "Ofertas Locais";
    const [c1, c2] = pickColors(category);

    const bg1 = variant === "dark" ? "#0b0f14" : "#f8fafc";
    const bg2 = variant === "dark" ? "#111827" : "#ffffff";
    const text = variant === "dark" ? "#ffffff" : "#0f172a";
    const muted = variant === "dark" ? "rgba(255,255,255,.70)" : "rgba(15,23,42,.65)";

    const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg1}"/>
        <stop offset="1" stop-color="${bg2}"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect width="1080" height="1350" fill="url(#bg)"/>
    <circle cx="770" cy="260" r="310" fill="url(#accent)" opacity="0.25"/>
    <circle cx="820" cy="320" r="180" fill="url(#accent)" opacity="0.35"/>

    <g filter="url(#soft)">
      <rect x="80" y="170" rx="60" ry="60" width="920" height="980" fill="rgba(0,0,0,0)" />
      <circle cx="540" cy="420" r="220" fill="rgba(255,255,255,0.10)"/>
      <rect x="150" y="820" rx="40" ry="40" width="780" height="90" fill="url(#accent)" opacity="0.35"/>
    </g>

    <text x="120" y="1180" font-size="54" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="${text}" font-weight="900">${title}</text>
    <text x="120" y="1245" font-size="34" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="${muted}" font-weight="800">${esc(category)}</text>
  </svg>`.trim();

    const encoded = encodeURIComponent(svg)
        .replaceAll("%0A", "")
        .replaceAll("%20", " ");

    return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
