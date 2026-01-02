import React from "react";
import { Link } from "react-router-dom";
import "../../styles/app.css";

function money(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return "0,00";
    return n.toFixed(2).replace('.', ',');
}

export default function ProductCard({ offer }) {
    // imagem quadrada (fallback se não tiver square)
    const imgUrl = offer.imageSquareUrl || offer.images?.coverLightUrl || offer.coverImageUrl || "";

    return (
        <Link to={`/swipe?focus=${offer.id}`} className="product">
            <div className="productImg">
                {imgUrl ? (
                    <img src={imgUrl} alt={offer.title} />
                ) : (
                    <div style={{ height: '100%', background: '#eee', display: 'grid', placeItems: 'center', fontSize: 24 }}>🛒</div>
                )}
                {offer.discount && (
                    <div className="badge warn">{offer.discount}% OFF</div>
                )}
            </div>
            <div className="productBody">
                <h3 className="productName">{offer.title}</h3>
                <p className="price">R$ {money(offer.price)}</p>
                {offer.oldPrice && <p className="sub" style={{ textDecoration: 'line-through' }}>R$ {money(offer.oldPrice)}</p>}

                <div className="sub" style={{ marginTop: 6 }}>
                    {offer.marketName || "Mercado"}
                </div>
            </div>
        </Link>
    );
}
