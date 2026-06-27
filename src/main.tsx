import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import { LanguageProvider } from "./lib/LanguageContext.tsx";
import { AndroidPermissionProvider } from "./context/AndroidPermissionContext.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <HashRouter>
        <LanguageProvider>
          <AndroidPermissionProvider>
            <App />
          </AndroidPermissionProvider>
        </LanguageProvider>
      </HashRouter>
    </StrictMode>
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}
