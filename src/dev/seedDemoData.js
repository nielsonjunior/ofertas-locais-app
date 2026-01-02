import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

const CITIES = [
    { id: "city_001", name: "São Paulo" },
    { id: "city_002", name: "Campinas" },
];

const MARKETS = [
    { id: "mkt_001", name: "Supermercado São João" },
    { id: "mkt_002", name: "Atacadão do Bairro" },
    { id: "mkt_003", name: "Mercado Central" },
    { id: "mkt_004", name: "Hiper Popular" },
    { id: "mkt_005", name: "Bom Preço" },
    { id: "mkt_006", name: "Pão & Cia" },
    { id: "mkt_007", name: "Fresh Hortifruti" },
    { id: "mkt_008", name: "Casa da Limpeza" },
];

const CATEGORIES = [
    { cat: "Hortifruti", titles: ["Banana Prata 1kg", "Tomate 1kg", "Maçã Gala 1kg", "Alface", "Cebola 1kg"] },
    { cat: "Carnes", titles: ["Frango 1kg", "Patinho moído 500g", "Linguiça 1kg", "Carne Moída 1kg"] },
    { cat: "Bebidas", titles: ["Coca-Cola 2L", "Guaraná 2L", "Água 1,5L", "Suco 1L", "Cerveja Lata 350ml"] },
    { cat: "Laticínios", titles: ["Leite Integral 1L", "Iogurte 170g", "Queijo Mussarela 300g", "Manteiga 200g"] },
    { cat: "Limpeza", titles: ["Detergente 500ml", "Sabão em Pó 1kg", "Amaciante 2L", "Álcool 70 1L"] },
    { cat: "Padaria", titles: ["Pão Francês (kg)", "Bolo Caseiro", "Pão de Forma", "Rosca Doce"] },
    { cat: "Congelados", titles: ["Pizza Congelada", "Hambúrguer 12un", "Batata Frita 1kg", "Sorvete 2L"] },
    { cat: "Mercearia", titles: ["Arroz 5kg", "Feijão 1kg", "Açúcar 1kg", "Café 500g", "Macarrão 500g"] },
];

function rand(min, max) {
    return Math.random() * (max - min) + min;
}
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function priceFor(title, cat) {
    // heurística simples
    const base =
        cat === "Carnes" ? rand(12, 45) :
            cat === "Bebidas" ? rand(3, 12) :
                cat === "Hortifruti" ? rand(2, 14) :
                    cat === "Laticínios" ? rand(4, 18) :
                        cat === "Limpeza" ? rand(5, 30) :
                            cat === "Padaria" ? rand(3, 20) :
                                cat === "Congelados" ? rand(10, 40) :
                                    rand(4, 25);

    // arredonda .99 ou .49
    const cents = Math.random() < 0.6 ? 0.99 : 0.49;
    return Number(Math.floor(base) + cents).toFixed(2);
}

export async function seedDemoData(db) {
    // cria markets (opcional)
    for (const m of MARKETS) {
        await setDoc(doc(db, "markets", m.id), {
            name: m.name,
            createdAt: serverTimestamp(),
        }, { merge: true });
    }

    // cria muitas offers
    let counter = 1;
    for (const city of CITIES) {
        for (let i = 0; i < 40; i++) {
            const bucket = pick(CATEGORIES);
            const title = pick(bucket.titles);
            const market = pick(MARKETS);
            const price = Number(priceFor(title, bucket.cat));
            const hasOld = Math.random() < 0.65;
            const oldPrice = hasOld ? Number((price / (1 - rand(0.10, 0.35))).toFixed(2)) : null;

            const id = `demo_${city.id}_${String(counter).padStart(3, "0")}`;
            counter++;

            await setDoc(doc(db, "offers", id), {
                title,
                titleLower: title.toLowerCase(),
                category: bucket.cat,
                subcategory: "",
                price,
                oldPrice: oldPrice || null,
                active: true,

                cityId: city.id,
                cityName: city.name,

                marketId: market.id,
                marketName: market.name,

                // imagens vazias, o app vai usar fallback
                images: {
                    coverLightUrl: "",
                    coverDarkUrl: "",
                },

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
    }

    return true;
}
