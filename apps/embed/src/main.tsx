import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EmbedPlaceholder } from "./EmbedPlaceholder";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("root element id mismatch: apps/embed/index.html must define #root");
}

createRoot(container).render(
  <StrictMode>
    <EmbedPlaceholder />
  </StrictMode>,
);
