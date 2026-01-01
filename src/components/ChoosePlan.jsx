import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Header from './Header';

const ChoosePlan = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSelectPlan = async (planType) => {
        if (!currentUser) return;
        setLoading(true);

        try {
            const userRef = doc(db, "users", currentUser.uid);

            // In a real app, you would integrate Stripe/MercadoPago here.
            // For now, we instantly activate the plan.
            await updateDoc(userRef, {
                plan: planType,
                subscriptionStatus: 'active',
                subscriptionDate: new Date().toISOString()
            });

            alert(`Plano ${planType} ativado com sucesso!`);
            navigate('/merchant');
        } catch (error) {
            console.error("Error activating plan:", error);
            alert("Erro ao ativar o plano. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="merchant-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="app-icon-wrapper" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Voltar para o Início">
                        <i className="fas fa-store app-icon"></i>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button className="sidebar-item" onClick={() => navigate('/merchant')} title="Dashboard">
                        <i className="fas fa-bullseye"></i>
                        <span className="sidebar-tooltip">Dashboard</span>
                    </button>
                    <button className="sidebar-item" onClick={() => navigate('/merchant/new-offer')} title="Nova Oferta">
                        <i className="fas fa-plus-circle"></i>
                        <span className="sidebar-tooltip">Nova Oferta</span>
                    </button>
                    <button className="sidebar-item active" title="Meu Plano">
                        <i className="fas fa-credit-card"></i>
                        <span className="sidebar-tooltip">Plano</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-divider"></div>
                    <button className="sidebar-item" onClick={() => navigate('/merchant/settings')} title="Configurações">
                        <i className="fas fa-cog"></i>
                    </button>
                    <div className="sidebar-profile" onClick={() => navigate('/merchant/profile')} title="Meu Perfil">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="sidebar-avatar" />
                        ) : (
                            <div className="sidebar-avatar placeholder">
                                {currentUser?.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <main className="merchant-content">
                <div style={{ background: 'transparent', minHeight: 'calc(100vh - 40px)', padding: '30px', borderRadius: '20px' }}>
                    <div className="container" style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
                        <h1 style={{ color: '#1D3557', fontSize: '2.5rem', marginBottom: '10px' }}>Escolha o plano ideal para você</h1>
                        <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '50px' }}>Comece a vender mais hoje mesmo com o OfertasLocais.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                            {/* Free Plan */}
                            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '2px solid #E63946', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#E63946', color: 'white', padding: '5px 15px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    RECOMENDADO
                                </div>
                                <h3 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '10px' }}>Iniciante</h3>
                                <div style={{ fontSize: '3rem', fontWeight: '800', color: '#1D3557', marginBottom: '20px' }}>
                                    Grátis
                                    <span style={{ fontSize: '1rem', color: '#999', fontWeight: 'normal' }}> /mês</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: '0', textAlign: 'left', marginBottom: '30px', color: '#555' }}>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Até 5 Anúncios Ativos</li>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Página da Loja (Perfil)</li>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Link para WhatsApp/Social</li>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Suporte por Email</li>
                                </ul>
                                <button
                                    onClick={() => handleSelectPlan('Grátis (Beta)')}
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '15px' }}
                                >
                                    {loading ? 'Ativando...' : 'Começar Agora'}
                                </button>
                            </div>

                            {/* Pro Plan (Disabled Preview) */}
                            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #eee', opacity: '0.7', filter: 'grayscale(1)' }}>
                                <h3 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '10px' }}>Profissional</h3>
                                <div style={{ fontSize: '3rem', fontWeight: '800', color: '#1D3557', marginBottom: '20px' }}>
                                    R$ 49,90
                                    <span style={{ fontSize: '1rem', color: '#999', fontWeight: 'normal' }}> /mês</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: '0', textAlign: 'left', marginBottom: '30px', color: '#555' }}>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Anúncios Ilimitados</li>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Destaque na Home</li>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> IA para Criar Anúncios</li>
                                    <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: 'green', marginRight: '10px' }}></i> Relatórios Avançados</li>
                                </ul>
                                <button disabled className="btn" style={{ width: '100%', padding: '15px', background: '#ccc', cursor: 'not-allowed' }}>
                                    Em Breve
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChoosePlan;
