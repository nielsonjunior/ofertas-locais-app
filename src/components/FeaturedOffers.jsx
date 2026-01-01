import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const FeaturedOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // Fetch only active offers
                const q = query(
                    collection(db, "offers"),
                    where("status", "==", "active"),
                    limit(6)
                );
                const querySnapshot = await getDocs(q);
                const offersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOffers(offersData);
            } catch (error) {
                console.error("Error fetching offers: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, []);

    if (loading) {
        return <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Carregando ofertas...</div>;
    }

    return (
        <section id="ofertas" className="featured-offers">
            <div className="container">
                <div className="section-header">
                    <h2>Ofertas em Destaque</h2>
                    <div className="section-divider"></div>
                </div>

                <div className="offers-grid">
                    {offers.map((offer) => (
                        <div
                            className="offer-card"
                            key={offer.id}
                            onClick={() => navigate(`/offer/${offer.id}`)}
                        >
                            <div className="offer-image-container">
                                <img
                                    src={offer.imageUrl || 'https://via.placeholder.com/300x200'}
                                    alt={offer.title}
                                    className="offer-img"
                                />
                                {offer.discount && (
                                    <span className="discount-tag">-{offer.discount}%</span>
                                )}
                            </div>

                            <div className="offer-content">
                                <span className="offer-category">{offer.category || 'Geral'}</span>
                                <h3 className="offer-title">{offer.title}</h3>

                                <div className="offer-footer">
                                    <div className="offer-price-container">
                                        <span className="offer-currency">R$</span>
                                        <span className="offer-price">
                                            {parseFloat(offer.price).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <div className="offer-meta">
                                        <i className="fa-regular fa-eye"></i>
                                        <span>{offer.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedOffers;
