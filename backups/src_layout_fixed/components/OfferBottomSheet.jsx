import React, { useEffect, useState } from 'react';

const OfferBottomSheet = ({ offer, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (offer) {
            setIsVisible(true);
            // Prevent body scroll when sheet is open
            document.body.style.overflow = 'hidden';
        }
    }, [offer]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
            document.body.style.overflow = '';
        }, 300); // Wait for animation
    };

    if (!offer) return null;

    return (
        <div className={`bottom-sheet-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
            <div
                className={`bottom-sheet-panel ${isVisible ? 'visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sheet-handle-bar">
                    <div className="sheet-handle"></div>
                </div>

                <div className="sheet-content">
                    <div className="sheet-header">
                        <span className="sheet-category">{offer.category}</span>
                        <button className="sheet-close-btn" onClick={handleClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <h2 className="sheet-title">{offer.title}</h2>

                    <div className="sheet-price-row">
                        <div className="sheet-price-container">
                            <span className="sheet-currency">R$</span>
                            <span className="sheet-price">
                                {parseFloat(offer.price).toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                        {offer.discount && (
                            <span className="sheet-discount">-{offer.discount}%</span>
                        )}
                    </div>

                    <div className="sheet-divider"></div>

                    <div className="sheet-description">
                        <h3>Detalhes da Oferta</h3>
                        <p>{offer.description || "Aproveite esta oferta incrível exclusiva para você. Garanta já o seu desconto antes que acabe o tempo!"}</p>

                        <div className="sheet-meta">
                            <div className="meta-item">
                                <i className="far fa-clock"></i>
                                <span>Válido até: <strong>30/12</strong></span>
                            </div>
                            <div className="meta-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>Disponível em: <strong>Loja Centro</strong></span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default OfferBottomSheet;
