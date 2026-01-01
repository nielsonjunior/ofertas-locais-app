import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

const ReviewsSection = ({ offerId }) => {
    const { currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        if (offerId) {
            fetchReviews();
        }
    }, [offerId]);

    const fetchReviews = async () => {
        try {
            const q = query(
                collection(db, "reviews"),
                where("offerId", "==", offerId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(reviewsData);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            // Fallback for missing index error on first run
            if (error.code === 'failed-precondition') {
                console.warn("Missing index for reviews query. Please create it in Firebase Console.");
            }
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Você precisa fazer login para avaliar.");
        if (rating === 0) return alert("Por favor, selecione uma nota de 1 a 5.");

        setSubmitting(true);
        try {
            // 1. Add Review Document (Rating Only)
            const reviewData = {
                offerId,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                rating,
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "reviews"), reviewData);

            // 2. Update Offer Stats (Atomic)
            const offerRef = doc(db, "offers", offerId);
            const offerSnap = await getDoc(offerRef);

            if (offerSnap.exists()) {
                const data = offerSnap.data();
                const newCount = (data.ratingCount || 0) + 1;
                const newSum = (data.ratingSum || 0) + rating;
                const newAverage = newSum / newCount;

                await updateDoc(offerRef, {
                    ratingCount: newCount,
                    ratingSum: newSum,
                    averageRating: newAverage
                });
            } else {
                await updateDoc(offerRef, {
                    ratingCount: 1,
                    ratingSum: rating,
                    averageRating: rating
                });
            }

            // Reset Form and Refresh
            setRating(0);
            fetchReviews();
            alert("Avaliação enviada com sucesso!");
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Erro ao enviar avaliação.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: '40px', background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '25px', color: '#1D3557', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                Avaliações dos Clientes ({reviews.length})
            </h3>

            {/* Review List - Condensed */}
            <div className="reviews-list" style={{ marginBottom: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {loadingReviews ? (
                    <p>Carregando avaliações...</p>
                ) : reviews.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', gridColumn: '1/-1' }}>Seja o primeiro a avaliar este produto!</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} style={{ padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px', fontSize: '0.9rem' }}>{review.userName}</div>
                            <div style={{ color: '#FFC107', fontSize: '0.85rem' }}>
                                {[...Array(5)].map((_, i) => (
                                    <i key={i} className={i < review.rating ? "fas fa-star" : "far fa-star"}></i>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Review Form - Rating Only */}
            <div className="add-review" style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', textAlign: 'center' }}>
                {currentUser ? (
                    <>
                        <h4 style={{ marginBottom: '15px', color: '#1D3557' }}>Deixe sua nota</h4>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '2rem', color: '#FFC107', cursor: 'pointer', display: 'inline-block' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i
                                            key={star}
                                            className={star <= (hoverRating || rating) ? "fas fa-star" : "far fa-star"}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            style={{ margin: '0 5px' }}
                                        ></i>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                                style={{ opacity: submitting ? 0.7 : 1, padding: '10px 40px' }}
                            >
                                {submitting ? 'Enviando...' : 'Avaliar'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '15px', color: '#666' }}>Faça login para avaliar.</p>
                        <a href="/login" className="btn btn-login" style={{ display: 'inline-block' }}>Fazer Login</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
