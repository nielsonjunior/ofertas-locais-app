import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import OfferBottomSheet from './OfferBottomSheet';

const MobileFeed = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // Fetch plenty of active offers for the feed
                const q = query(
                    collection(db, "offers"),
                    where("status", "==", "active"),
                    limit(20)
                );
                const querySnapshot = await getDocs(q);
                const offersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOffers(offersData);
            } catch (error) {
                console.error("Error fetching feed offers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, []);

    const [menuOpen, setMenuOpen] = useState(false);
    // Note: If you need auth state here, import AuthContext. 
    // For simplicity, we'll assume basic navigation first or just redirect to login page.
    // Ideally duplicate Header logic or create a MobileMenu component. 
    // Let's add simple navigation for now.

    const toggleMenu = () => setMenuOpen(!menuOpen);

    if (loading) return <div className="mobile-feed-loading">Carregando feed...</div>;

    return (
        <div className="mobile-feed-container">
            {/* Top Bar / Floating Header */}
            <div className="mobile-top-bar">
                <button className="mobile-menu-btn" onClick={toggleMenu}>
                    <div className="hamburger-line"></div>
                    <div className="hamburger-line"></div>
                    <div className="hamburger-line"></div>
                </button>
                {/* Optional: Add Logo or "For You" text here */}
            </div>

            {/* Menu Overlay */}
            {menuOpen && (
                <div className="mobile-menu-overlay">
                    <div className="mobile-menu-content">
                        <button className="close-menu-btn" onClick={toggleMenu}>&times;</button>
                        <nav className="mobile-nav">
                            <a href="/" onClick={toggleMenu}>Início</a>
                            <a href="/search" onClick={toggleMenu}>Buscar</a>
                            <a href="/login" onClick={toggleMenu}>Entrar / Cadastrar</a>
                            {/* Add more links as needed */}
                        </nav>
                    </div>
                    <div className="mobile-menu-backdrop" onClick={toggleMenu}></div>
                </div>
            )}

            {offers.map((offer) => (
                <div key={offer.id} className="feed-item">
                    <img
                        src={offer.imageUrl || 'https://via.placeholder.com/400x800'}
                        alt={offer.title}
                        className="feed-bg-image"
                        onClick={() => setSelectedOffer(offer)}
                    />

                    <div className="feed-overlay">
                        <div className="feed-content">
                            <span className="feed-category">{offer.category}</span>
                            <h2 className="feed-title">{offer.title}</h2>
                            <div className="feed-price-row">
                                <span className="feed-currency">R$</span>
                                <span className="feed-price">
                                    {parseFloat(offer.price).toFixed(2).replace('.', ',')}
                                </span>
                                {offer.discount && (
                                    <span className="feed-discount">-{offer.discount}%</span>
                                )}
                            </div>

                            <button
                                className="feed-cta-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOffer(offer);
                                }}
                            >
                                Ver Oferta <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>

                        <div className="feed-actions">
                            <button className="action-btn">
                                <i className="fa-regular fa-heart"></i>
                                <span>{offer.views || 0}</span>
                            </button>
                            <button className="action-btn">
                                <i className="fa-solid fa-star" style={{ color: '#FFD700' }}></i>
                                <span>{offer.averageRating ? offer.averageRating.toFixed(1) : 'New'}</span>
                            </button>
                            <button
                                className="action-btn"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent click from navigating to details
                                    if (navigator.share) {
                                        navigator.share({
                                            title: offer.title,
                                            text: `Olha essa oferta incrível: ${offer.title} por apenas R$ ${parseFloat(offer.price).toFixed(2).replace('.', ',')}!`,
                                            url: `${window.location.origin}/offer/${offer.id}`,
                                        }).catch(console.error);
                                    } else {
                                        navigator.clipboard.writeText(`${window.location.origin}/offer/${offer.id}`);
                                        alert("Link copiado!");
                                    }
                                }}
                            >
                                <i className="fa-solid fa-share" style={{ color: 'white' }}></i>
                                <span>Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}


            {/* Spacer for bottom navigation if needed, or just end of feed */}
            <div className="feed-end-spacer"></div>

            {/* Bottom Sheet Component */}
            <OfferBottomSheet
                offer={selectedOffer}
                onClose={() => setSelectedOffer(null)}
            />
        </div>
    );
};

export default MobileFeed;
