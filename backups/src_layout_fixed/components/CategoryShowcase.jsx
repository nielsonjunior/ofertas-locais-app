import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const CategoryShowcase = () => {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // Fetch a batch of offers to populate the grids
                // In a real app, you'd fetch specific categories for each block
                const q = query(
                    collection(db, "offers"),
                    where("status", "==", "active"),
                    limit(12)
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOffers(data);
            } catch (error) {
                console.error("Error fetching showcase offers:", error);
            }
        };
        fetchOffers();
    }, []);

    // Helper to render a card block
    const ShowcaseBlock = ({ title, items, badgeColor }) => {
        if (!items || items.length === 0) return null;

        const mainItem = items[0];
        const subItems = items.slice(1, 4);

        return (
            <div className="showcase-block">
                <div className="showcase-header">
                    <h3>{title}</h3>
                    <a href="#" className="showcase-link">Ver mais</a>
                </div>

                <div className="showcase-content">
                    {/* Hero Item */}
                    <div
                        className="showcase-hero"
                        onClick={() => navigate(`/offer/${mainItem.id}`)}
                    >
                        <img src={mainItem.imageUrl} alt={mainItem.title} />
                        <div className="showcase-hero-info">
                            <span className="showcase-badge" style={{ background: badgeColor }}>
                                {items === offers ? "Oferta do Dia" : "Desconto"}
                            </span>
                            <h4>{mainItem.title}</h4>
                        </div>
                    </div>

                    {/* Sub Items Row */}
                    <div className="showcase-thumbs">
                        {subItems.map(item => (
                            <div
                                key={item.id}
                                className="showcase-thumb"
                                onClick={() => navigate(`/offer/${item.id}`)}
                            >
                                <img src={item.imageUrl} alt={item.title} />
                            </div>
                        ))}
                        {/* Fill empty slots if less than 3 sub-items */}
                        {[...Array(Math.max(0, 3 - subItems.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="showcase-thumb empty"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="category-showcase-section">
            <div className="container">
                <div className="showcase-grid">
                    <ShowcaseBlock
                        title="OFERTAS DO DIA"
                        items={offers.slice(0, 4)}
                        badgeColor="#E63946"
                    />
                    <ShowcaseBlock
                        title="OFERTAS RELÂMPAGO"
                        items={offers.slice(4, 8)}
                        badgeColor="#FB8C00"
                    />
                    <ShowcaseBlock
                        title="MAIS VENDIDOS"
                        items={offers.slice(8, 12)}
                        badgeColor="#2E7D32"
                    />
                </div>
            </div>
        </section>
    );
};

export default CategoryShowcase;
