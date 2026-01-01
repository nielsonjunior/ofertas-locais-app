import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const isActive = (path) => {
        if (path === '/merchant' && location.pathname === '/merchant') return true;
        if (path !== '/merchant' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="app-icon-wrapper" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Voltar para o Início">
                    <i className="fas fa-store app-icon"></i>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`sidebar-item ${isActive('/merchant') ? 'active' : ''}`}
                    onClick={() => navigate('/merchant')}
                    title="Dashboard"
                >
                    <i className="fas fa-bullseye"></i>
                    <span className="sidebar-tooltip">Dashboard</span>
                </button>

                <button
                    className={`sidebar-item ${isActive('/merchant/new-offer') ? 'active' : ''}`}
                    onClick={() => navigate('/merchant/new-offer')}
                    title="Nova Oferta"
                >
                    <i className="fas fa-plus-circle"></i>
                    <span className="sidebar-tooltip">Nova Oferta</span>
                </button>

                <button
                    className={`sidebar-item ${isActive('/merchant/plan') ? 'active' : ''}`}
                    onClick={() => navigate('/merchant/plan')}
                    title="Meu Plano"
                >
                    <i className="fas fa-credit-card"></i>
                    <span className="sidebar-tooltip">Plano</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-divider"></div>

                <button
                    className={`sidebar-item ${isActive('/merchant/settings') ? 'active' : ''}`}
                    onClick={() => navigate('/merchant/settings')}
                    title="Configurações"
                >
                    <i className="fas fa-cog"></i>
                    <span className="sidebar-tooltip">Configurações</span>
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

                <button
                    className="sidebar-item"
                    onClick={handleLogout}
                    title="Sair"
                    style={{ marginTop: '10px', color: '#EF4444' }}
                >
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="sidebar-tooltip">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
