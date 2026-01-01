import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Header from './Header';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            const userCredential = await login(email, password);
            const user = userCredential.user;

            console.log("Login success, checking role...");

            // Check user role in Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                console.log("User data:", userData);
                if (userData.role === 'merchant') {
                    navigate('/merchant');
                } else {
                    navigate('/');
                }
            } else {
                console.log("No user document found");
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Falha ao fazer login. Verifique suas credenciais.');
        }

        setLoading(false);
    }

    return (
        <>
            <Header />
            <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    background: '#fff',
                    padding: '40px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(29, 53, 87, 0.1)',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ textAlign: 'center', color: '#1D3557', marginBottom: '20px', fontWeight: '700' }}>Bem-vindo de volta</h2>

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
                        <div style={{ marginBottom: '25px' }}>
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
                        <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Entrar
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                        Não tem uma conta? <Link to="/register" style={{ color: '#E63946', fontWeight: '600' }}>Cadastre-se</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Login;
