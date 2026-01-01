import React from 'react';

const Newsletter = () => {
    return (
        <section className="newsletter-section">
            <div className="container">
                <h2>Não perca nenhuma oferta!</h2>
                <form className="newsletter-form">
                    <input
                        type="email"
                        className="newsletter-input"
                        placeholder="Seu melhor e-mail"
                    />
                    <button type="submit" className="btn-subscribe">
                        Cadastrar
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Newsletter;
