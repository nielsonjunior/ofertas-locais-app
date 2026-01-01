import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { searchProductImages } from '../services/imageSearchService';
import { processImageForUpload } from '../utils/imageProcessor';

const CreateOffer = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'restaurantes',
        expiryDate: ''
    });
    const [isNearExpiry, setIsNearExpiry] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [errors, setErrors] = useState({});

    // Image Search State
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch offer data if in edit mode
    useEffect(() => {
        const fetchOffer = async () => {
            if (isEditing) {
                const docRef = doc(db, "offers", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title,
                        description: data.description || '',
                        price: isNaN(data.price) ? data.price : data.price.toFixed(2).replace('.', ','),
                        category: data.category || 'restaurantes',
                        expiryDate: data.expiryDate || ''
                    });
                    setIsNearExpiry(data.isNearExpiry || false);
                    if (data.imageUrl) {
                        setExistingImageUrl(data.imageUrl);
                        setImagePreview(data.imageUrl);
                    }
                } else {
                    console.log("No such document!");
                    navigate('/merchant');
                }
            }
        };

        fetchOffer();
    }, [id, isEditing, navigate]);

    // Update search query when title changes (suggestion)
    useEffect(() => {
        if (!isEditing && formData.title) {
            // Optional: auto-update search query logic if desired, but let's keep it manual for now
        }
    }, [formData.title]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };



    const handleImageChange = async (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Process Image (Resize & Pad)
                const { file: processedFile, previewUrl } = await processImageForUpload(file);
                setImageFile(processedFile);
                setImagePreview(previewUrl);
            } catch (error) {
                console.error("Image processing failed:", error);
                // Fallback to original
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSearchCheck = () => {
        setSearchQuery(formData.title); // Pre-fill with title
        setShowSearchModal(true);
        // Automatically search if title exists
        if (formData.title) {
            performSearch(formData.title);
        }
    };

    const performSearch = async (query) => {
        if (!query) return;
        setIsSearching(true);
        try {
            const results = await searchProductImages(query);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectImage = async (url) => {
        setShowSearchModal(false);
        try {
            // Treat the selected external URL as an image to be processed
            // This downloads it, pads it onto the canvas, and turns it into a File
            const { file: processedFile, previewUrl } = await processImageForUpload(url);

            setImageFile(processedFile); // We will upload this new file
            setImagePreview(previewUrl);
            setExistingImageUrl(''); // Clear existing URL since we are now uploading a new file
        } catch (error) {
            console.error("Failed to process search result image:", error);
            // Fallback: just use the URL directly if processing fails
            setExistingImageUrl(url);
            setImagePreview(url);
            setImageFile(null);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title) newErrors.title = "O título é obrigatório.";
        if (!formData.price) newErrors.price = "O preço é obrigatório.";

        // Validate expiry date only if "Near Expiry" is checked
        if (isNearExpiry && !formData.expiryDate) {
            newErrors.expiryDate = "Para ofertas de vencimento, a data é obrigatória.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            let imageUrl = existingImageUrl; // Default to existing image (or selected from search)

            if (imageFile) {
                // Upload new image to Firebase Storage if a file was selected locally
                const storageRef = ref(storage, `offers/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            } else if (!imageUrl) {
                // Determine placeholder if NOTHING exists
                imageUrl = 'https://via.placeholder.com/600x400?text=Sem+Imagem';
            }

            const offerData = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price.replace('R$', '').replace(',', '.').trim()),
                currency: 'BRL',
                category: formData.category,
                expiryDate: isNearExpiry ? formData.expiryDate : null,
                isNearExpiry: isNearExpiry,
                merchantId: currentUser.uid,
                merchantName: currentUser.email,
                imageUrl,
                updatedAt: new Date().toISOString()
            };

            if (!isEditing) {
                // Add new offer
                offerData.views = 0;
                offerData.status = 'active';
                offerData.createdAt = new Date().toISOString();
                await addDoc(collection(db, "offers"), offerData);
            } else {
                // Update existing offer
                const offerRef = doc(db, "offers", id);
                await updateDoc(offerRef, offerData);
            }

            navigate('/merchant');
        } catch (error) {
            console.error("Error saving document: ", error);
            alert('Erro ao salvar oferta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <div className="create-offer-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1D3557', margin: 0 }}>{isEditing ? 'Editar Anúncio' : 'Nova Oferta'}</h2>
                        <p style={{ color: '#666', marginTop: '5px' }}>Preencha os detalhes para divulgar seu produto.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="create-offer-grid">

                        {/* Left Column: Form Fields */}
                        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Informações Básicas</h3>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Título do Anúncio *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="modern-input"
                                    placeholder="Ex: Combo Pizza Gigante + Refri"
                                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', transition: 'border-color 0.2s' }}
                                />
                                {errors.title && <small style={{ color: '#E63946', marginTop: '5px', display: 'block' }}>{errors.title}</small>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Preço (R$) *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#888' }}>R$</span>
                                        <input
                                            type="text"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="modern-input"
                                            placeholder="0,00"
                                            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        />
                                    </div>
                                    {errors.price && <small style={{ color: '#E63946', marginTop: '5px', display: 'block' }}>{errors.price}</small>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Categoria</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="modern-input"
                                        style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' }}
                                    >
                                        <option value="restaurantes">🍔 Restaurantes</option>
                                        <option value="moda">👕 Moda & Roupas</option>
                                        <option value="beleza">💅 Beleza & Estética</option>
                                        <option value="mercado">🛒 Mercado</option>
                                        <option value="servicos">🛠️ Serviços</option>
                                        <option value="eletros">🔌 Eletrônicos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Descrição Detalhada</label>
                                <textarea
                                    name="description"
                                    rows="6"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="modern-input"
                                    placeholder="Descreva o que está incluso, regras de uso, validade, etc..."
                                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'inherit' }}
                                ></textarea>
                            </div>
                        </div>

                        {/* Right Column: Media */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', margin: 0 }}>Imagem do Produto</h3>
                                    <button
                                        type="button"
                                        onClick={handleSearchCheck}
                                        style={{ background: '#E3F2FD', color: '#1976D2', border: 'none', padding: '8px 12px', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <i className="fas fa-search"></i> Buscar na Web
                                    </button>
                                </div>

                                <div className="image-upload-container" style={{ position: 'relative' }}>
                                    <input
                                        type="file"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        id="file-upload"
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '250px',
                                            border: '2px dashed #cbd5e0',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : '#f8f9fa',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {!imagePreview && (
                                            <>
                                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: '#a0aec0', marginBottom: '15px' }}></i>
                                                <span style={{ color: '#4a5568', fontWeight: '600' }}>Clique para enviar imagem</span>
                                                <span style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: '5px' }}>JPG, PNG (Max 5MB)</span>
                                            </>
                                        )}
                                        {imagePreview && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover-overlay">
                                                <span style={{ color: 'white', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px' }}>Alterar Imagem</span>
                                            </div>
                                        )}
                                    </label>
                                    <style>{`
                                        label:hover { border-color: #1D3557; background-color: #f0f4f8; }
                                        label:hover .hover-overlay { opacity: 1; }
                                    `}</style>
                                </div>
                            </div>

                            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Validade & Urgência</h3>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', padding: '10px', borderRadius: '8px', transition: 'background 0.2s' }} className="expiry-option">
                                    <input
                                        type="checkbox"
                                        checked={isNearExpiry}
                                        onChange={(e) => setIsNearExpiry(e.target.checked)}
                                        style={{ width: '20px', height: '20px', accentColor: '#E63946' }}
                                    />
                                    <div>
                                        <span style={{ display: 'block', fontWeight: '600', color: '#333' }}>Oferta Relâmpago / Vencimento Próximo</span>
                                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>Marque para destacar urgência</span>
                                    </div>
                                </label>
                                <style>{` .expiry-option:hover { background: #f9f9f9; } `}</style>

                                {isNearExpiry && (
                                    <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease-in-out' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#c53030' }}>Válido até *</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleChange}
                                            className="modern-input"
                                            style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #fed7d7', fontSize: '1rem', color: '#c53030' }}
                                        />
                                        {errors.expiryDate && <small style={{ color: '#E63946', marginTop: '5px', display: 'block' }}>{errors.expiryDate}</small>}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/merchant')}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        borderRadius: '50px',
                                        fontWeight: '600',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="btn"
                                    style={{
                                        flex: 2,
                                        padding: '15px',
                                        borderRadius: '50px',
                                        fontWeight: '600',
                                        background: '#1D3557',
                                        color: 'white',
                                        border: 'none',
                                        cursor: loading ? 'wait' : 'pointer',
                                        boxShadow: '0 4px 15px rgba(29, 53, 87, 0.3)',
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Salvando...</> : (isEditing ? 'Salvar Alterações' : 'Publicar Agora')}
                                </button>
                            </div>

                        </div>
                    </div>
                </form>
            </div>

            {/* IMAGE SEARCH MODAL */}
            {showSearchModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }} onClick={() => setShowSearchModal(false)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }} onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#1D3557' }}>Buscar Imagem do Produto</h3>
                            <button onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>&times;</button>
                        </div>

                        {/* Search Bar */}
                        <div style={{ padding: '20px 25px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Digite o nome do produto..."
                                style={{ flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                            />
                            <button
                                onClick={() => performSearch(searchQuery)}
                                disabled={isSearching}
                                style={{
                                    background: '#1D3557',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0 20px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {isSearching ? '...' : <i className="fas fa-search"></i>}
                            </button>
                        </div>

                        {/* Results Grid */}
                        <div style={{ padding: '25px', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
                            {isSearching ? (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '15px' }}></i>
                                    <p>Buscando as melhores imagens...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                                    {searchResults.map((img) => (
                                        <div
                                            key={img.id}
                                            onClick={() => handleSelectImage(img.contentUrl)}
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                transition: 'transform 0.2s',
                                                aspectRatio: '4/3',
                                                position: 'relative'
                                            }}
                                            className="search-result-item"
                                        >
                                            <img
                                                src={img.thumbnailUrl}
                                                alt={img.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {img.title}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>
                                    <i className="fas fa-image" style={{ fontSize: '3rem', marginBottom: '15px' }}></i>
                                    <p>Digite algo para buscar imagens.</p>
                                </div>
                            )}
                        </div>
                        <style>{`.search-result-item:hover { transform: scale(1.03); ring: 2px solid #1D3557; }`}</style>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateOffer;
