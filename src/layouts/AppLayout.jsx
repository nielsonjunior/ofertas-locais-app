import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { theme } from "../ui/theme";

export default function AppLayout() {
    const { pathname } = useLocation();
    const isSwipe = pathname.startsWith("/swipe");

    return (
        <div style={{ minHeight: "100dvh", background: theme.bg }}>
            {!isSwipe && <TopBar />}
            <div style={{ minHeight: "100dvh", paddingBottom: isSwipe ? 0 : 110 }}>
                <Outlet />
            </div>
            {!isSwipe && <BottomNav />}
        </div>
    );
}
