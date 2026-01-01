import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const isMerchant = userData?.role === 'merchant';

    return (
        <header className="main-header">
            <div className="container header-content">
                {/* Logo Section */}
                <Link to={isMerchant ? "/merchant" : "/"} className="logo">
                    {isMerchant && userData?.photoUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                                src={userData.photoUrl}
                                alt="Logo Loja"
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-blue)' }}
                            />
                            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1D3557' }}>
                                {userData.storeName || 'Sua Loja'}
                            </span>
                        </div>
                    ) : (
                        <>OFERTAS<span className="logo-highlight">LOCAIS</span></>
                    )}
                </Link>

                {/* Mobile Menu Button (Hamburger) */}
                <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
                    <div className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>

                {/* Mobile Menu Backdrop */}
                <div className={`mobile-backdrop ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}></div>

                {/* Navigation */}
                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    {isMerchant ? (
                        <>
                            {/* Merchant Links */}
                            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Início</Link>
                            <Link to="/merchant" className="nav-link" onClick={() => setIsMenuOpen(false)}>Painel</Link>
                            {/* Optional: Add more merchant specific links here if needed */}
                        </>
                    ) : (
                        <>
                            {/* Customer Links */}
                            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Início</Link>
                            <a href="/#ofertas" className="nav-link" onClick={() => setIsMenuOpen(false)}>Ofertas</a>
                            <a href="/#categorias" className="nav-link" onClick={() => setIsMenuOpen(false)}>Categorias</a>
                        </>
                    )}

                    {currentUser ? (
                        <div className="auth-buttons">
                            {!isMerchant && (
                                <Link to="/profile" className="btn btn-outline mobile-full" onClick={() => setIsMenuOpen(false)}>
                                    <i className="fas fa-user"></i> Minha Conta
                                </Link>
                            )}
                            <button onClick={handleLogout} className="btn btn-outline mobile-full" style={{ borderColor: '#ddd', color: '#666' }}>
                                Sair
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-primary mobile-full" onClick={() => setIsMenuOpen(false)}>Entrar</Link>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
