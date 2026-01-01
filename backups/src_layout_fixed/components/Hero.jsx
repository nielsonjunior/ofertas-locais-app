import React from 'react';

const Hero = () => {
    return (
        <section className="hero" id="home">
            <div className="container">
                <h1>
                    Ofertas Imperdíveis na <span className="highlight">Sua Cidade!</span>
                </h1>
                <p>
                    Descontos de <b style={{ color: '#E63946' }}>40% a 60%</b> só em lojas físicas perto de você!
                </p>
                <a href="#ofertas" className="btn btn-primary hero-cta">
                    Confira Agora!
                </a>
            </div>
        </section>
    );
};

export default Hero;
