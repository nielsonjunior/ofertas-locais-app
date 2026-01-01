import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';

const MerchantDashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        if (!currentUser) return;

        try {
            // Check Subscription Status
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef, { source: 'server' });

            if (userSnap.exists()) {
                const userData = userSnap.data();

                if (userData.role !== 'merchant') {
                    alert("Acesso restrito para lojistas.");
                    navigate('/');
                    return;
                }

                if (userData.subscriptionStatus !== 'active') {
                    console.log("Subscription inactive, redirecting to plan...");
                    navigate('/merchant/plan');
                    return;
                }
            }

            const q = query(
                collection(db, "offers"),
                where("merchantId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchProducts();
        }
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este anúncio?")) {
            try {
                await deleteDoc(doc(db, "offers", id));
                fetchProducts();
            } catch (error) {
                console.error("Error deleting offer:", error);
                alert("Erro ao excluir oferta.");
            }
        }
    };

    // Calculate stats
    const activeAds = products.length;
    const totalViews = products.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Painel do Lojista</h1>
                <div className="dashboard-actions">
                    {/* Actions if any */}
                </div>
            </div>

            {/* Stats Row */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3 style={{ fontSize: '1.8rem' }}>{activeAds}</h3>
                    <p>Anúncios Ativos</p>
                </div>
                <div className="stat-card">
                    <h3 style={{ fontSize: '1.8rem' }}>{totalViews}</h3>
                    <p>Visualizações</p>
                </div>
                <div className="stat-card">
                    <h3 style={{ fontSize: '1.8rem' }}>0</h3>
                    <p>Favoritos</p>
                </div>
            </div>

            {/* Products Section */}
            <div className="products-section">

                {/* Desktop Table */}
                <table className="products-table desktop-only">
                    <colgroup>
                        <col style={{ width: '50%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th style={{ textAlign: 'center' }}>Preço</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td className="product-cell">
                                    {product.imageUrl && <img src={product.imageUrl} alt="" className="product-thumb" />}
                                    <span className="product-name">{product.title}</span>
                                </td>
                                <td>R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}</td>
                                <td>
                                    <span className={`status-badge ${product.status}`}>
                                        {product.status || 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/merchant/edit-offer/${product.id}`)} className="action-btn edit" title="Editar">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="action-btn delete" title="Excluir">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>
                                    Nenhum produto cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards (Visible only on mobile) */}
                <div className="mobile-product-list mobile-only">
                    {products.map(product => (
                        <div key={product.id} className="mobile-product-card">
                            <div className="mobile-product-image">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.title} />
                                ) : (
                                    <div className="placeholder-img"><i className="fas fa-box"></i></div>
                                )}
                            </div>
                            <div className="mobile-product-info">
                                <h4 className="mobile-product-title">{product.title}</h4>
                                <div className="mobile-product-meta">
                                    <span className="mobile-product-price">R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}</span>
                                    <span className={`status-badge small ${product.status}`}>{product.status || 'Active'}</span>
                                </div>
                                <div className="mobile-product-stats">
                                    <i className="fas fa-eye"></i> {product.views || 0} visualizações
                                </div>
                            </div>
                            <div className="mobile-product-actions">
                                <button onClick={() => navigate(`/merchant/edit-offer/${product.id}`)} className="mobile-action-btn edit">
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="mobile-action-btn delete">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: '15px' }}></i>
                            <p>Sua loja está vazia.</p>
                            <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/merchant/new-offer')}>Criar Primeiro Anúncio</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MerchantDashboard;

