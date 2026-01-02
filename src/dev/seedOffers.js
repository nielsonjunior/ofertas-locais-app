import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const CITIES = ["Sorocaba", "São Paulo", "Campinas", "Santos"];

const MERCHANTS = [
    { id: "mercado-top", name: "Supermercado Top", cat: "Mercado" },
    { id: "padaria-pao", name: "Padaria do Pão", cat: "Padaria" },
    { id: "acougue-boi", name: "Açougue Boi Bom", cat: "Açougue" },
    { id: "farmacia-bem", name: "Drogaria Bem Estar", cat: "Farmácia" },
    { id: "pet-amigo", name: "Pet Shop Amigo", cat: "Pet" },
    { id: "burger-kingo", name: "Burger Kingo", cat: "Restaurante" },
    { id: "loja-fashion", name: "Fashion Modas", cat: "Moda" },
    { id: "horti-fruti", name: "Hortifruti Frescor", cat: "Hortifruti" },
];

const PRODUCTS = {
    "Mercado": ["Arroz 5kg", "Feijão 1kg", "Óleo de Soja", "Macarrão", "Molho de Tomate", "Sabão em Pó"],
    "Padaria": ["Pão Francês (kg)", "Bolo de Chocolate", "Sonho", "Pão de Queijo", "Leite Integral"],
    "Açougue": ["Picanha (kg)", "Contra Filé (kg)", "Linguiça Toscana", "Frango Inteiro", "Costela"],
    "Farmácia": ["Dorflex", "Dipirona", "Shampoo", "Fralda Pampers", "Protetor Solar"],
    "Pet": ["Ração Pedigree 10kg", "Whiskas Sachê", "Coleira", "Shampoo Pet", "Brinquedo Osso"],
    "Restaurante": ["X-Bacon", "X-Salada", "Combo Família", "Pastel de Carne", "Pizza Calabresa"],
    "Moda": ["Camiseta Básica", "Calça Jeans", "Vestido Floral", "Tênis Esportivo", "Boné"],
    "Hortifruti": ["Banana Prata (kg)", "Maçã Gala (kg)", "Batata Inglesa", "Tomate", "Alface Americana"],
};

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndPrice() { return (Math.random() * 80 + 3).toFixed(2); }

export async function seedOffers({ count = 50 } = {}) {
    // Limpar? Não, o usuario pediu para adicionar.

    const promises = [];
    for (let i = 0; i < count; i++) {
        const city = rnd(CITIES);
        const merchant = rnd(MERCHANTS);
        const productBase = PRODUCTS[merchant.cat] ? rnd(PRODUCTS[merchant.cat]) : "Produto Geral";
        const title = `${productBase} - Oferta ${i + 1}`;

        // Random discount
        const price = Number(rndPrice());
        const hasDiscount = Math.random() > 0.5;
        const oldPrice = hasDiscount ? (price * (1 + Math.random() * 0.5)).toFixed(2) : null;

        promises.push(
            addDoc(collection(db, "offers"), {
                merchantId: merchant.id,
                storeName: merchant.name,
                storePhone: "1199999-0000",
                storeAddress: "Centro",
                city,
                category: merchant.cat,
                title,
                price,
                oldPrice: oldPrice ? Number(oldPrice) : null,
                unit: "un",
                status: "active",
                views: Math.floor(Math.random() * 1000),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })
        );
    }

    await Promise.all(promises);
    console.log(`Seeded ${count} offers!`);
    alert(`Adicionadas ${count} ofertas variadas!`);
}
