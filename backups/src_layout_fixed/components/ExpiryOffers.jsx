import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const ExpiryOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // Fetch active offers flagged as near expiry
                const q = query(
                    collection(db, "offers"),
                    where("status", "==", "active"),
                    where("isNearExpiry", "==", true),
                    limit(4)
                );
                const querySnapshot = await getDocs(q);
                const offersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Filter out offers that might not have expiryDate properly set if any
                setOffers(offersData);
            } catch (error) {
                console.error("Error fetching expiry offers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, []);

    if (loading) return null;
    if (offers.length === 0) return null;

    return (
        <section className="expiry-offers" style={{ background: '#FFF3E0', padding: '50px 0' }}>
            <div className="container">
                <div className="section-header">
                    <h2 style={{ color: '#E65100' }}>⚠️ Vencimento Próximo</h2>
                    <div className="section-divider" style={{ borderColor: '#FFCC80' }}></div>
                    <p style={{ color: '#E65100', marginTop: '10px' }}>Oportunidades únicas que acabam logo!</p>
                </div>

                <div className="offers-grid">
                    {offers.map((offer) => (
                        <div
                            className="offer-card"
                            key={offer.id}
                            onClick={() => navigate(`/offer/${offer.id}`)}
                            style={{ border: '1px solid #FFCC80' }}
                        >
                            <div className="offer-image-container">
                                <img
                                    src={offer.imageUrl || 'https://via.placeholder.com/300x200'}
                                    alt={offer.title}
                                    className="offer-img"
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: '#D32F2F',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '50px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    <i className="far fa-clock" style={{ marginRight: '5px' }}></i>
                                    {offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString('pt-BR') : 'Urgente'}
                                </div>
                            </div>

                            <div className="offer-content">
                                <span className="offer-category" style={{ color: '#E65100' }}>{offer.category || 'Promoção'}</span>
                                <h3 className="offer-title">{offer.title}</h3>

                                <div className="offer-footer">
                                    <div className="offer-price-container">
                                        <span className="offer-currency">R$</span>
                                        <span className="offer-price" style={{ color: '#D32F2F' }}>
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

export default ExpiryOffers;
