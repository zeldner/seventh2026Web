import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.jsx";
import AdaptiveExam from "./AdaptiveExam.jsx";
// import App from "./ModelAI.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdaptiveExam />
  </StrictMode>
);
