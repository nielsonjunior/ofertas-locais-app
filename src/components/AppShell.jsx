import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import useIsAdmin from "../hooks/useIsAdmin";
import { logout } from "../utils/auth";

export default function AppShell({ children }) {
    const loc = useLocation();
    const nav = useNavigate();
    const { user, loading } = useAuthUser();
    const { isAdmin } = useIsAdmin();
    const path = loc.pathname;

    return (
        <div className="app-root">
            <header className="topbar">
                <div className="topbar-inner">
                    <div className="brand" onClick={() => nav("/")}>
                        <div className="dot" />
                        <span>Ofertas Locais</span>
                    </div>

                    <nav className="navlinks">
                        <TopLink to="/" active={path === "/"}>Home</TopLink>
                        <TopLink to="/swipe" active={path.startsWith("/swipe")}>Swipe</TopLink>
                        <TopLink to="/favorites" active={path.startsWith("/favorites")}>Favoritos</TopLink>
                        {isAdmin ? <TopLink to="/admin/create-offer" active={path.startsWith("/admin")}>Admin</TopLink> : null}
                        <TopLink to="/profile" active={path.startsWith("/profile")}>Perfil</TopLink>
                    </nav>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {loading ? null : !user ? (
                            <button className="btn btn-ghost" onClick={() => nav("/login")}>Entrar</button>
                        ) : (
                            <button
                                className="btn btn-ghost"
                                onClick={async () => {
                                    await logout();
                                    nav("/");
                                }}
                            >
                                Sair
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="main">{children}</main>

            {/* bottom nav mobile (mockup) */}
            <footer className="bottomnav">
                <Link className={`bn-item ${path === "/" ? "active" : ""}`} to="/">
                    <div className="bn-ico">🏠</div><span>Início</span>
                </Link>

                <a
                    className={`bn-item ${path === "/" ? "active" : ""}`}
                    href="#categorias"
                    onClick={(e) => {
                        e.preventDefault();
                        if (path !== "/") nav("/");
                        setTimeout(() => {
                            const el = document.getElementById("categorias");
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
                    }}
                >
                    <div className="bn-ico">🗂️</div><span>Categorias</span>
                </a>

                <Link className={`bn-item ${path.startsWith("/favorites") ? "active" : ""}`} to="/favorites">
                    <div className="bn-ico">♡</div><span>Favoritos</span>
                </Link>

                <Link className={`bn-item ${path.startsWith("/swipe") ? "active" : ""}`} to="/swipe">
                    <div className="bn-ico">⚡</div><span>Swipe</span>
                </Link>

                <Link className={`bn-item ${path.startsWith("/profile") ? "active" : ""}`} to="/profile">
                    <div className="bn-ico">👤</div><span>Perfil</span>
                </Link>
            </footer>
        </div>
    );
}

function TopLink({ to, active, children }) {
    return <Link className={`toplink ${active ? "active" : ""}`} to={to}>{children}</Link>;
}
