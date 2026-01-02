import React from "react";
import BottomNav from "./BottomNav";
import "../../styles/app.css";

export default function MobileShell({ children, showNav = true }) {
    return (
        <div style={{ maxWidth: 520, margin: '0 auto', background: '#f5f6f8', minHeight: '100vh', position: 'relative' }}>
            {children}
            {showNav && <BottomNav />}
        </div>
    );
}
