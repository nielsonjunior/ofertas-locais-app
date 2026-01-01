import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import Header from './Header';
import Footer from './Footer';
import ReviewsSection from './ReviewsSection';

const OfferDetails = () => {
    const { id } = useParams();
    const [offer, setOffer] = useState(null);
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Offer
                const offerRef = doc(db, "offers", id);
                const offerSnap = await getDoc(offerRef);

                if (offerSnap.exists()) {
                    const offerData = offerSnap.data();
                    setOffer(offerData);

                    // Increment view count
                    updateDoc(offerRef, { views: increment(1) });

                    // 2. Fetch Merchant Details
                    if (offerData.merchantId) {
                        const merchantRef = doc(db, "users", offerData.merchantId);
                        const merchantSnap = await getDoc(merchantRef);
                        if (merchantSnap.exists()) {
                            setMerchant(merchantSnap.data());
                        }
                    }
                } else {
                    console.log("No such offer!");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>;
    if (!offer) return <div style={{ textAlign: 'center', padding: '50px' }}>Oferta não encontrada.</div>;

    // Google Maps Universal Link
    const mapsLink = merchant?.address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(merchant.address)}`
        : null;

    return (
        <>
            <Header />
            <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 160px)', padding: '40px 0' }}>
                <div className="container" style={{ maxWidth: '900px' }}>
                    <Link to="/" style={{ display: 'inline-block', marginBottom: '20px', color: '#666' }}>
                        <i className="fas fa-arrow-left"></i> Voltar para Home
                    </Link>

                    <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                        {/* Product Image Area */}
                        <div style={{ width: '100%', aspectRatio: '4/3', maxHeight: '500px', background: '#fff', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img
                                src={offer.imageUrl || 'https://via.placeholder.com/800x600'}
                                alt={offer.title}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                            {offer.isNearExpiry && (
                                <div style={{
                                    position: 'absolute', top: '20px', left: '20px',
                                    background: '#D32F2F', color: 'white', padding: '8px 16px',
                                    borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}>
                                    ⚠️ Vence em: {new Date(offer.expiryDate).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '40px' }}>
                            {/* Header Info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                    <span style={{
                                        background: '#E3F2FD', color: '#1565C0', padding: '5px 12px',
                                        borderRadius: '50px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase'
                                    }}>
                                        {offer.category || 'Geral'}
                                    </span>
                                    <h1 style={{ fontSize: '2.5rem', color: '#1D3557', margin: '15px 0 10px' }}>{offer.title}</h1>
                                    <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>{offer.description || "Sem descrição informada."}</p>

                                    {/* Rating Badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', color: '#FFC107', fontSize: '1.1rem' }}>
                                        <i className="fas fa-star"></i>
                                        <span style={{ fontWeight: 'bold', color: '#333' }}>{offer.averageRating ? offer.averageRating.toFixed(1) : 'Novo'}</span>
                                        <span style={{ color: '#999', fontSize: '0.9rem' }}>({offer.ratingCount || 0} avaliações)</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#E63946' }}>
                                        R$ {parseFloat(offer.price).toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

                            {/* Merchant / Location Section */}
                            <div style={{ background: '#FAFAFA', padding: '25px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <h3 style={{ margin: '0 0 20px', color: '#333' }}>📍 Onde Encontrar</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px', color: '#1D3557' }}>{merchant?.storeName || "Vendedor Local"}</h4>
                                        <p style={{ margin: '0', color: '#555', fontSize: '1rem' }}>
                                            {merchant?.address || "Endereço não cadastrado."}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {mapsLink ? (
                                            <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textAlign: 'center', background: '#4285F4', boxShadow: 'none' }}>
                                                <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                                                Como Chegar (GPS)
                                            </a>
                                        ) : (
                                            <button disabled className="btn" style={{ background: '#eee', color: '#999', cursor: 'not-allowed' }}>Endereço indisponível</button>
                                        )}

                                        {merchant?.socialLink ? (
                                            <a href={merchant.socialLink} target="_blank" rel="noopener noreferrer" className="btn" style={{ textAlign: 'center', background: '#333', color: 'white' }}>
                                                <i className="fas fa-external-link-alt" style={{ marginRight: '8px' }}></i>
                                                Visitar Site / Rede Social
                                            </a>
                                        ) : (
                                            <button disabled className="btn" style={{ background: '#eee', color: '#999', cursor: 'not-allowed' }}>Site indisponível</button>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: offer.title,
                                                        text: `Olha essa oferta incrível: ${offer.title} por apenas R$ ${parseFloat(offer.price).toFixed(2).replace('.', ',')}!`,
                                                        url: window.location.href,
                                                    }).catch(console.error);
                                                } else {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    alert("Link copiado para a área de transferência!");
                                                }
                                            }}
                                            className="btn"
                                            style={{ textAlign: 'center', background: '#25D366', color: 'white' }}
                                        >
                                            <i className="fas fa-share-alt" style={{ marginRight: '8px' }}></i>
                                            Compartilhar Oferta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ReviewsSection offerId={id} />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default OfferDetails;
