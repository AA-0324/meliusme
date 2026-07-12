import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMedianBridge } from "./lib/median";

initMedianBridge();

createRoot(document.getElementById("root")!).render(<App />);
