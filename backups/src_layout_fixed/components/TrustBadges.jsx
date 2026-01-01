import React from 'react';

const TrustBadges = () => {
    return (
        <section className="trust-badges-section container">
            <div className="trust-box box-verified">
                <div className="trust-header">
                    <i className="fas fa-check-circle trust-icon-large"></i>
                    <div className="trust-title">
                        <h3>Ofertas Verificadas</h3>
                        <p>Garantimos a validade de cada promoção.</p>
                    </div>
                </div>
                <div className="trust-body">
                    <i className="fas fa-shield-alt trust-icon-circle"></i>
                    <span>Todas as lojas são auditadas localmente.</span>
                </div>
            </div>

            <div className="trust-box box-review">
                <div className="trust-header">
                    <div className="thumbs-up-down">
                        <div className="thumb-circle thumb-up">
                            <i className="fas fa-thumbs-up"></i>
                        </div>
                    </div>
                    <div className="trust-title">
                        <h3>Avalie as Ofertas</h3>
                        <p>Sua opinião ajuda outros compradores.</p>
                    </div>
                </div>
                <div className="trust-body">
                    <i className="fas fa-star trust-icon-circle" style={{ color: '#FFC107' }}></i>
                    <span>Classifique e ganhe pontos no clube de vantagens!</span>
                </div>
            </div>
        </section>
    );
};

export default TrustBadges;
