import React from "react";
import { NavLink } from "react-router-dom";
import "../../styles/app.css";

export default function BottomNav() {
    return (
        <nav className="bottomNav">
            <div className="bottomNavInner">
                <NavItem to="/" icon="🏠" label="Início" />
                <NavItem to="/categories" icon="🗂️" label="Categorias" />
                <NavItem to="/favorites" icon="❤️" label="Favoritos" />
                <NavItem to="/profile" icon="👤" label="Perfil" />
            </div>
        </nav>
    );
}

function NavItem({ to, icon, label }) {
    return (
        <NavLink to={to} className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
            <span className="icon">{icon}</span>
            <span>{label}</span>
        </NavLink>
    );
}
