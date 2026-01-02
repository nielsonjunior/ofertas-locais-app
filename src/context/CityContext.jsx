import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CityContext = createContext(null);

export function CityProvider({ children }) {
    const [city, setCity] = useState(() => localStorage.getItem("selectedCity") || "");

    useEffect(() => {
        if (city) localStorage.setItem("selectedCity", city);
    }, [city]);

    const value = useMemo(() => ({ city, setCity }), [city]);
    return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
    const ctx = useContext(CityContext);
    if (!ctx) throw new Error("useCity deve ser usado dentro de CityProvider");
    return ctx;
}
