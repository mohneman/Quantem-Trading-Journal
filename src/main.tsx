import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "./theme";
import { StoreProvider } from "./store";
import { ToastProvider } from "./context/ToastContext";
import App from "./App";
import "./index.css";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <ToastProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>
);
