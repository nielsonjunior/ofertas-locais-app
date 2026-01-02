import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import SwipeFeed from "./pages/SwipeFeed";
import AccountGate from "./pages/AccountGate";
import MerchantHub from "./pages/merchant/MerchantHub";
import AdminCreateOffer from "./pages/admin/AdminCreateOffer"; // Mantendo para compatibilidade/demo seed
import { useIsAdmin } from "./hooks/useIsAdmin";

// Wrapper for admin routes
function AdminRoute({ children }) {
  const { isAdmin, loading } = useIsAdmin();
  if (loading) return null;
  return isAdmin ? children : <div>Acesso negado</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Account wrapper checks auth state then redirects */}
        <Route path="/account" element={<AccountGate />} />
        <Route path="/profile" element={<Profile />} />

        {/* Merchant Area */}
        <Route path="/merchant" element={<MerchantHub />} />

        {/* Legacy Admin */}
        <Route path="/admin/create" element={<AdminRoute><AdminCreateOffer /></AdminRoute>} />
      </Route>

      {/* Standalone Swipe Page */}
      <Route path="/swipe" element={<SwipeFeed />} />
    </Routes>
  );
}
