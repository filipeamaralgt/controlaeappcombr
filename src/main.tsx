import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator) {
  let reloadedForServiceWorker = false;

  window.addEventListener("load", async () => {
    if (isInIframe || isPreviewHost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadedForServiceWorker) return;
      reloadedForServiceWorker = true;
      window.location.reload();
    });

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        updateViaCache: "none",
      });
      registration.update().catch(() => {});
    } catch {
      // no-op
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
