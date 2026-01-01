import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchSection = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <section className="search-section">
            <div className="container">
                <div className="search-bar-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="O que você está procurando hoje?"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button className="btn-search" onClick={handleSearch}>
                        <i className="fas fa-search"></i> Buscar
                    </button>
                </div>
            </div>
        </section>
    );
};

export default SearchSection;
