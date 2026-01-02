const CATEGORY_THEME = {
    hortifruti: { label: "Hortifruti", accent: "#16A34A", from: "#16A34A", to: "#A7F3D0", icon: "🥬" },
    carnes: { label: "Carnes", accent: "#DC2626", from: "#DC2626", to: "#FCA5A5", icon: "🥩" },
    bebidas: { label: "Bebidas", accent: "#2563EB", from: "#2563EB", to: "#93C5FD", icon: "🥤" },
    laticinios: { label: "Laticínios", accent: "#0EA5E9", from: "#0EA5E9", to: "#A5F3FC", icon: "🥛" },
    limpeza: { label: "Limpeza", accent: "#7C3AED", from: "#7C3AED", to: "#C4B5FD", icon: "🧽" },
    padaria: { label: "Padaria", accent: "#D97706", from: "#D97706", to: "#FDE68A", icon: "🥖" },
    congelados: { label: "Congelados", accent: "#06B6D4", from: "#06B6D4", to: "#A5F3FC", icon: "🧊" },
    mercearia: { label: "Mercearia", accent: "#F97316", from: "#F97316", to: "#FDBA74", icon: "🛒" },
    pet: { label: "Pet", accent: "#DB2777", from: "#DB2777", to: "#F9A8D4", icon: "🐾" },
    outros: { label: "Outros", accent: "#334155", from: "#334155", to: "#CBD5E1", icon: "🏷️" },
};

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text || "").split(" ");
    let line = "";
    let lines = [];
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = w;
        } else line = test;
    }
    if (line) lines.push(line);

    if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1].replace(/\\s+\\S+$/, "…");
    }

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
}

export async function generateOfferArt({
    title,
    price,
    oldPrice,
    marketName,
    cityName,
    category = "outros",
    discountLabel,
    variant = "light"
}) {
    const theme = CATEGORY_THEME[category] || CATEGORY_THEME.outros;

    const W = 1080;
    const H = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    if (variant === "light") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, theme.from);
        grad.addColorStop(1, theme.to);
        ctx.fillStyle = grad;
    } else {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#0b0f14");
        grad.addColorStop(1, "#111827");
        ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < 4500; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.globalAlpha = 1;

    const cx = W * 0.5, cy = H * 0.33, r = 220;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = variant === "light" ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.font = "180px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.icon, cx, cy + 10);

    if (discountLabel) {
        ctx.save();
        ctx.translate(W * 0.12, H * 0.12);
        ctx.fillStyle = "#FACC15";
        roundRect(ctx, 0, 0, 280, 130, 28);
        ctx.fill();

        ctx.fillStyle = "#111827";
        ctx.font = "900 62px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(discountLabel, 140, 74);
        ctx.restore();
    }

    ctx.fillStyle = variant === "light" ? "#0f172a" : "#f8fafc";
    ctx.font = "900 70px system-ui";
    ctx.textAlign = "left";
    wrapText(ctx, title, 90, H * 0.62, W - 180, 82, 2);

    ctx.fillStyle = variant === "light" ? "rgba(15,23,42,0.7)" : "rgba(248,250,252,0.75)";
    ctx.font = "600 44px system-ui";
    ctx.fillText(`${marketName} • ${cityName}`, 90, H * 0.74);

    ctx.fillStyle = variant === "light" ? theme.accent : "#FACC15";
    ctx.font = "900 140px system-ui";
    ctx.fillText(`R$ ${price}`, 90, H * 0.84);

    if (oldPrice) {
        ctx.fillStyle = variant === "light" ? "rgba(15,23,42,0.55)" : "rgba(248,250,252,0.6)";
        ctx.font = "700 50px system-ui";
        ctx.fillText(`De R$ ${oldPrice}`, 90, H * 0.90);
    }

    return await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.92);
    });
}
