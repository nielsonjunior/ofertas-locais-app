import React from "react";
import "../../styles/app.css";

// Placeholder images
const FEATURES = [
    { id: 1, img: "https://via.placeholder.com/600x300/facc15/000?text=Oferta+Relampago" },
    { id: 2, img: "https://via.placeholder.com/600x300/22c55e/fff?text=Feira+Fresca" }
];

export default function FeaturedCarousel() {
    return (
        <div className="featuredWrap">
            {FEATURES.map(f => (
                <div key={f.id} className="featured">
                    <img src={f.img} alt="feature" />
                </div>
            ))}
            <div style={{ width: 10 }}></div>
        </div>
    );
}
