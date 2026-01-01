import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import MerchantDashboard from './components/MerchantDashboard';
import CreateOffer from './components/CreateOffer';
import MerchantProfile from './components/MerchantProfile';
import OfferDetails from './components/OfferDetails';
import ChoosePlan from './components/ChoosePlan';
import SeedDatabase from './components/SeedDatabase';
import SearchResults from './components/SearchResults';
import MerchantSettings from './components/MerchantSettings';
import MerchantLayout from './components/MerchantLayout'; // Correctly placed
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/offer/:id" element={<OfferDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            import MerchantLayout from './components/MerchantLayout';

            // ... (imports)

            // Inside Routes:
            <Route path="/merchant" element={<MerchantLayout />}>
              <Route index element={<MerchantDashboard />} />
              <Route path="profile" element={<MerchantProfile />} />
              <Route path="plan" element={<ChoosePlan />} />
              <Route path="new-offer" element={<CreateOffer />} />
              <Route path="edit-offer/:id" element={<CreateOffer />} />
              <Route path="settings" element={<MerchantSettings />} />
            </Route>
            <Route path="/seed" element={<SeedDatabase />} />
            {/* Future route: /admin */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
