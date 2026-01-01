import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Top10 = () => {
    const [topOffers, setTopOffers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopOffers = async () => {
            try {
                // Fetch active offers, sort by views to simulate "Top 10"
                // Note: sorting by 'views' descending requires an index in Firestore if combined with 'where'.
                // If it fails initially, we might need to sort client-side for small datasets or create the index.
                // For now, let's try client-side sort if the dataset is small, to avoid index creation block.

                const q = query(collection(db, "offers"), where("status", "==", "active"));
                const querySnapshot = await getDocs(q);
                let offers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Client-side sort to ensure we get the absolute top viewed
                offers.sort((a, b) => (b.views || 0) - (a.views || 0));

                // Take top 10
                setTopOffers(offers.slice(0, 10));
            } catch (error) {
                console.error("Error fetching Top 10 offers:", error);
            }
        };

        fetchTopOffers();
    }, []);

    if (topOffers.length === 0) return null; // Don't show if empty

    return (
        <section className="top-10-section" id="top10">
            <div className="container">
                <div className="section-header">
                    <h2>Top 10 Ofertas da Semana</h2>
                    <div className="section-divider"></div>
                </div>
                <div className="top-cards-grid">
                    {topOffers.map((offer) => (
                        <div
                            className="top-card"
                            key={offer.id}
                            onClick={() => navigate(`/offer/${offer.id}`)}
                        >
                            <img
                                src={offer.imageUrl || 'https://via.placeholder.com/300x200'}
                                alt={offer.title}
                                className="top-card-img-element"
                            />
                            <div className="top-card-details">
                                <div className="top-card-row">
                                    <span className="top-card-title">{offer.title}</span>
                                    {offer.discount && (
                                        <span className="discount-text">{offer.discount}% OFF</span>
                                    )}
                                </div>
                                <div className="top-card-rating">
                                    <i className="fas fa-star" style={{ color: '#FFC107' }}></i>
                                    <span>{offer.averageRating ? offer.averageRating.toFixed(1) : 'Novo'}</span>
                                    {offer.averageRating >= 4.5 && <span className="rating-badge">Excelente</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Top10;
