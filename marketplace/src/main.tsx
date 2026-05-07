import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { CatalogProvider } from "./lib/catalog";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CatalogProvider>
      <App />
    </CatalogProvider>
  </React.StrictMode>,
);
