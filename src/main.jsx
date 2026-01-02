import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CityProvider } from "./context/CityContext";
import { CategoryProvider } from "./context/CategoryContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CityProvider>
        <CategoryProvider>
          <App />
        </CategoryProvider>
      </CityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
