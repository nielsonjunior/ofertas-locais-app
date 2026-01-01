import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

const SeedDatabase = () => {
    const [status, setStatus] = useState('Idle');
    const [progress, setProgress] = useState(0);

    const categories = [
        { name: 'games', keywords: ['game', 'console', 'joystick'] },
        { name: 'fashion', keywords: ['shirt', 'dress', 'shoes'] },
        { name: 'tech', keywords: ['smartphone', 'laptop', 'tablet'] },
        { name: 'food', keywords: ['burger', 'pizza', 'sushi'] },
        { name: 'home', keywords: ['furniture', 'sofa', 'lamp'] }
    ];

    const generateRandomOffer = (index, merchantId) => {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const keyword = cat.keywords[Math.floor(Math.random() * cat.keywords.length)];
        // Using loremflickr for random real images based on keyword
        // Adding index to param to avoid duplicate caching issues in browser
        const imageUrl = `https://loremflickr.com/400/300/${keyword}?lock=${index}`;

        return {
            title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Oferta ${index}`,
            price: (Math.random() * 500 + 50).toFixed(2),
            category: cat.name,
            description: `Este é um produto incrível do tipo ${keyword}. Aproveite esta oferta exclusiva por tempo limitado. Qualidade garantida.`,
            imageUrl: imageUrl,
            merchantId: merchantId,
            status: 'active',
            views: Math.floor(Math.random() * 500),
            isNearExpiry: Math.random() > 0.8, // 20% chance
            expiryDate: new Date(Date.now() + 86400000 * (Math.random() * 10)).toISOString()
        };
    };

    const handleSeed = async () => {
        setStatus('Iniciando...');
        setProgress(0);

        try {
            // 1. Create Merchants
            const merchantIds = ['merch_A', 'merch_B', 'merch_C', 'merch_D', 'merch_E'];

            for (let i = 0; i < merchantIds.length; i++) {
                await setDoc(doc(db, "users", merchantIds[i]), {
                    uid: merchantIds[i],
                    email: `merchant${i}@test.com`,
                    storeName: `Loja Teste ${String.fromCharCode(65 + i)}`,
                    address: `Rua Exemplo, ${100 * (i + 1)}, São Paulo`,
                    socialLink: 'https://instagram.com',
                    subscriptionStatus: 'active',
                    role: 'merchant'
                });
            }
            setStatus('Lojistas criados. Criando produtos...');

            // 2. Create MANY Offers (e.g. 50)
            const totalOffers = 50;
            for (let i = 0; i < totalOffers; i++) {
                const randomMerchant = merchantIds[Math.floor(Math.random() * merchantIds.length)];
                const offerData = generateRandomOffer(i, randomMerchant);
                await addDoc(collection(db, "offers"), offerData);
                setProgress(((i + 1) / totalOffers) * 100);
            }

            setStatus(`Sucesso! ${totalOffers} produtos adicionados.`);
        } catch (error) {
            console.error(error);
            setStatus('Erro: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ color: '#1D3557' }}>Gerador de Produtos</h1>
            <p>Clique abaixo para popular o banco de dados com 50 produtos usando imagens reais (aleatórias).</p>

            <button
                onClick={handleSeed}
                disabled={status.includes('Iniciando') || status.includes('Criando')}
                style={{
                    marginTop: '20px',
                    padding: '15px 40px',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    background: '#E63946',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    opacity: status.includes('Iniciando') ? 0.7 : 1
                }}>
                {status.includes('Sucesso') ? 'Gerar Mais' : '🧨 Explodir de Ofertas'}
            </button>

            <div style={{ marginTop: '30px', background: '#eee', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, background: '#2E7D32', height: '100%', transition: 'width 0.3s' }}></div>
            </div>
            <p style={{ marginTop: '10px', fontWeight: 'bold', color: '#333' }}>{status}</p>

            {status.includes('Sucesso') && (
                <a href="/" style={{ display: 'inline-block', marginTop: '20px', color: '#1D3557', textDecoration: 'underline' }}>
                    Voltar para Home e ver resultado
                </a>
            )}
        </div>
    );
};

export default SeedDatabase;
