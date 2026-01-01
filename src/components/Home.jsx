import React from 'react';
import Header from './Header';
import Hero from './Hero';

import ExpiryOffers from './ExpiryOffers';
import Categories from './Categories';
import Top10 from './Top10';
import TrustBadges from './TrustBadges';
import MobileFeed from './MobileFeed';
import Footer from './Footer';

const Home = () => {
    return (
        <>
            <div className="mobile-only">
                <MobileFeed />
            </div>

            <div className="desktop-only">
                <Header />
                <Hero />
                <Top10 />
                <ExpiryOffers />
                <Categories />
                <TrustBadges />
                <Footer />
            </div>
        </>
    );
}

export default Home;
