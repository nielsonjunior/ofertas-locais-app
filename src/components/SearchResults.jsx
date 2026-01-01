import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Header from './Header';
import Footer from './Footer';

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('Resultados');

    // Helper to get query params
    const useQuery = () => new URLSearchParams(location.search);
    const queryParams = useQuery();
    const category = queryParams.get('category');
    const searchTerm = queryParams.get('q');

    useEffect(() => {
        const fetchOffers = async () => {
            setLoading(true);
            try {
                const offersRef = collection(db, "offers");
                let data = [];

                if (category) {
                    // Exact category match via Firestore
                    const qRef = query(offersRef, where("category", "==", category), where("status", "==", "active"));
                    const querySnapshot = await getDocs(qRef);
                    data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTitle(`Categoria: ${category.charAt(0).toUpperCase() + category.slice(1)}`);
                } else if (searchTerm) {
                    // Client-side "Smart" Search
                    // Fetch all active offers and filter in memory
                    // (Note: For production with thousands of items, use Algolia/Elasticsearch)
                    const qRef = query(offersRef, where("status", "==", "active"));
                    const querySnapshot = await getDocs(qRef);
                    const allOffers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    const term = searchTerm.toLowerCase();
                    data = allOffers.filter(offer =>
                        offer.title?.toLowerCase().includes(term) ||
                        offer.description?.toLowerCase().includes(term) ||
                        offer.category?.toLowerCase().includes(term)
                    );
                    setTitle(`Resultados para: "${searchTerm}"`);
                } else {
                    // Default: Show all recent active offers
                    const qRef = query(offersRef, where("status", "==", "active"));
                    const querySnapshot = await getDocs(qRef);
                    data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTitle('Todas as Ofertas');
                }

                setOffers(data);
            } catch (error) {
                console.error("Error fetching search results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, [category, searchTerm]);

    return (
        <>
            <Header />
            <div className="container" style={{ padding: '40px 0', minHeight: '60vh' }}>
                <div className="section-header">
                    <h2>{title}</h2>
                    <div className="section-divider"></div>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>Carregando...</p>
                ) : offers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <i className="fas fa-search" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '20px' }}></i>
                        <p style={{ fontSize: '1.2rem', color: '#666' }}>Nenhuma oferta encontrada nesta categoria.</p>
                        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>
                            Voltar para Home
                        </button>
                    </div>
                ) : (
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
                )}
            </div>
            <Footer />
        </>
    );
};

export default SearchResults;
