import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import Header from './Header';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isMerchant, setIsMerchant] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        console.log("HandleSubmit called");

        if (password !== passwordConfirm) {
            console.log("Passwords do not match");
            return setError('As senhas não coincidem');
        }

        try {
            setError('');
            setLoading(true);
            console.log("Calling signup with:", email);
            const userCredential = await signup(email, password);
            console.log("Signup success:", userCredential.user.uid);
            const user = userCredential.user;

            // Create user document in Firestore
            console.log("Saving to Firestore...");
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                role: isMerchant ? 'merchant' : 'user',
                subscriptionStatus: isMerchant ? 'inactive' : 'na', // Users don't need subs yet
                createdAt: new Date().toISOString()
            });

            if (isMerchant) {
                navigate('/merchant');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Este email já está em uso.');
            } else {
                setError('Falha ao criar conta. Tente novamente.');
            }
        }

        setLoading(false);
    }

    return (
        <>
            <Header />
            <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <div style={{
                    background: '#fff',
                    padding: '40px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(29, 53, 87, 0.1)',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ textAlign: 'center', color: '#1D3557', marginBottom: '20px', fontWeight: '700' }}>Criar Conta</h2>

                    {error && <div style={{ background: '#FFEBEE', color: '#D32F2F', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Email</label>
                            <input
                                type="email"
                                required
                                className="search-input"
                                style={{ width: '100%', border: '1px solid #ddd', background: '#F9FAFB' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Senha</label>
                            <input
                                type="password"
                                required
                                className="search-input"
                                style={{ width: '100%', border: '1px solid #ddd', background: '#F9FAFB' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Confirmar Senha</label>
                            <input
                                type="password"
                                required
                                className="search-input"
                                style={{ width: '100%', border: '1px solid #ddd', background: '#F9FAFB' }}
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', background: '#F0F4F8', padding: '10px', borderRadius: '8px' }}>
                            <input
                                type="checkbox"
                                id="merchant-check"
                                checked={isMerchant}
                                onChange={(e) => setIsMerchant(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="merchant-check" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#1D3557', fontWeight: '600' }}>Quero vender (Sou Lojista)</label>
                        </div>

                        <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Cadastrar
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                        Já tem uma conta? <Link to="/login" style={{ color: '#E63946', fontWeight: '600' }}>Entrar</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Register;
