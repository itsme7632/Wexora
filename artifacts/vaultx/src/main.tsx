import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Cross-origin API support for static hosting deploys.
//
// The app normally calls its API on same-origin (dev server proxy or the
// API server serving the built frontend). When a static deployment is
// served from a different origin than the API, VITE_API_URL is injected
// at build time and every relative /api request is rewritten to it.
// Vite statically replaces process.env.* with import.meta.env.* at build.
const apiBaseUrl = (import.meta as any).env?.VITE_API_URL;
if (apiBaseUrl) {
  void import("@workspace/api-client-react").then(({ setBaseUrl }) =>
    setBaseUrl(apiBaseUrl),
  );
}

createRoot(document.getElementById("root")!).render(<App />);
