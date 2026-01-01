import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const MerchantSettings = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // User Profile Form State
    const [formData, setFormData] = useState({
        displayName: '',
        storeName: '',
        phoneNumber: '',
        email: '',
        socialLink: '',
        address: '',
        description: ''
    });

    const [subscription, setSubscription] = useState({
        plan: 'Grátis (Beta)',
        status: 'active'
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;
            try {
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setFormData({
                        displayName: data.displayName || '',
                        storeName: data.storeName || '',
                        phoneNumber: data.phoneNumber || '',
                        email: currentUser.email || '',
                        socialLink: data.socialLink || '',
                        address: data.address || '',
                        description: data.description || ''
                    });
                    setSubscription({
                        plan: data.plan || 'Grátis (Beta)',
                        status: data.subscriptionStatus || 'active'
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                storeName: formData.storeName,
                phoneNumber: formData.phoneNumber,
                socialLink: formData.socialLink,
                address: formData.address,
                description: formData.description
            });
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando configurações...</div>;

    return (
        <div style={{ padding: '40px' }}>
            <div className="settings-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 className="dashboard-title" style={{ marginBottom: '30px' }}>Configurações da Loja</h1>

                {/* Plan Info Section */}
                <div className="plan-banner" style={{
                    background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)',
                    color: 'white',
                    padding: '25px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 15px rgba(29, 53, 87, 0.2)'
                }}>
                    <div>
                        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '5px' }}>Seu Plano Atual</p>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{subscription.plan}</h2>
                        <span className="status-badge active" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginTop: '10px', display: 'inline-block', padding: '5px 10px', borderRadius: '4px' }}>
                            {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/merchant/plan')}
                        style={{
                            background: '#E63946',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                    >
                        Mudar Plano
                    </button>
                </div>

                {/* Edit Profile Form */}
                <div className="profile-form-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                    <h3 className="mb-4 text-xl font-bold text-gray-700" style={{ marginBottom: '20px', color: '#1D3557' }}>Dados do Lojista</h3>
                    <form onSubmit={handleSubmit}>
                        {/* Basic Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Nome do Responsável</label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Nome da Loja</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Email (Login)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="form-input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee', background: '#f9f9f9', cursor: 'not-allowed' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Link do Site ou Rede Social</label>
                            <input
                                type="text"
                                name="socialLink"
                                value={formData.socialLink}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                placeholder="https://instagram.com/sualoja"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Endereço Completo</label>
                            <textarea
                                name="address"
                                rows="2"
                                value={formData.address}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                placeholder="Rua, Número, Bairro, Cidade - Estado"
                            ></textarea>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Descrição da Loja</label>
                            <textarea
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                placeholder="Uma breve descrição sobre o que sua loja oferece..."
                            ></textarea>
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'right' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-primary"
                                style={{
                                    padding: '12px 30px',
                                    background: '#1D3557',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    cursor: saving ? 'wait' : 'pointer',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 15px rgba(29, 53, 87, 0.3)'
                                }}
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MerchantSettings;
