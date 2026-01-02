import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
    const [selectedCategories, setSelectedCategories] = useState(() => {
        const raw = localStorage.getItem("selectedCategories");
        return raw ? JSON.parse(raw) : [];
    });

    useEffect(() => {
        localStorage.setItem("selectedCategories", JSON.stringify(selectedCategories));
    }, [selectedCategories]);

    const value = useMemo(
        () => ({ selectedCategories, setSelectedCategories }),
        [selectedCategories]
    );

    return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
    const ctx = useContext(CategoryContext);
    if (!ctx) throw new Error("useCategories deve ser usado dentro de CategoryProvider");
    return ctx;
}
