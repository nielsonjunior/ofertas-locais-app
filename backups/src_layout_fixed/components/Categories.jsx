import React from 'react';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
    const navigate = useNavigate();

    const categories = [
        { name: 'Restaurantes', slug: 'restaurantes', icon: 'fa-utensils', class: 'cat-restaurants' },
        { name: 'Moda', slug: 'moda', icon: 'fa-tshirt', class: 'cat-fashion' },
        { name: 'Beleza', slug: 'beleza', icon: 'fa-spa', class: 'cat-beauty' },
        { name: 'Mercado', slug: 'mercado', icon: 'fa-shopping-cart', class: 'cat-markets' },
        { name: 'Serviços', slug: 'servicos', icon: 'fa-tools', class: 'cat-services' },
        { name: 'Eletros', slug: 'eletros', icon: 'fa-plug', class: 'cat-eletros' },
    ];

    const handleCategoryClick = (slug) => {
        navigate(`/search?category=${slug}`);
        // Optional: Scroll to top
        window.scrollTo(0, 0);
    };

    return (
        <section className="categories-section" id="categorias">
            <div className="container">
                <div className="section-header">
                    <h2>Explore por Categoria</h2>
                </div>
                <div className="categories-grid">
                    {categories.map((cat, index) => (
                        <div
                            className="category-item"
                            key={index}
                            onClick={() => handleCategoryClick(cat.slug)}
                        >
                            <div className={`cat-icon-box ${cat.class}`}>
                                <i className={`fas ${cat.icon}`}></i>
                            </div>
                            <span className="category-name">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;
