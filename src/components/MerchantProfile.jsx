import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from './Header';

const MerchantProfile = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        storeName: '',
        socialLink: '',
        address: '',
        description: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData({ ...formData, ...docSnap.data() });
                }
            }
        };
        fetchProfile();
    }, [currentUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const docRef = doc(db, "users", currentUser.uid);
            await updateDoc(docRef, {
                storeName: formData.storeName,
                socialLink: formData.socialLink,
                address: formData.address,
                description: formData.description
            });
            alert('Perfil atualizado com sucesso!');
            navigate('/merchant');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert('Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="container" style={{ padding: '40px 0', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#1D3557', marginBottom: '30px' }}>Dados da Loja</h2>
            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nome da Loja</label>
                    <input
                        type="text"
                        name="storeName"
                        className="search-input"
                        style={{ width: '100%', border: '1px solid #ddd' }}
                        value={formData.storeName || ''}
                        onChange={handleChange}
                        placeholder="Ex: Pizzaria do João"
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Link do Site ou Rede Social</label>
                    <input
                        type="text"
                        name="socialLink"
                        className="search-input"
                        style={{ width: '100%', border: '1px solid #ddd' }}
                        value={formData.socialLink || ''}
                        onChange={handleChange}
                        placeholder="Ex: https://instagram.com/sua_loja ou seu site"
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Endereço Completo</label>
                    <textarea
                        name="address"
                        rows="3"
                        className="search-input"
                        style={{ width: '100%', border: '1px solid #ddd' }}
                        value={formData.address || ''}
                        onChange={handleChange}
                        placeholder="Rua, Número, Bairro, Cidade - SP"
                        required
                    ></textarea>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Descrição da Loja</label>
                    <textarea
                        name="description"
                        rows="3"
                        className="search-input"
                        style={{ width: '100%', border: '1px solid #ddd' }}
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Conte um pouco sobre seu negócio..."
                    ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => navigate('/merchant')} className="btn" style={{ flex: 1, background: '#e2e8f0', color: '#4a5568' }}>
                        Voltar
                    </button>
                    <button disabled={loading} type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        {loading ? 'Salvando...' : 'Salvar Dados'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MerchantProfile;
