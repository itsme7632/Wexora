import { createRoot } from "react-dom/client";
import "./lib/api-bootstrap"; // must run before App: wires VITE_API_URL for client + raw fetch
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
