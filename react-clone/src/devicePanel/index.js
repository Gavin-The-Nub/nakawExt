import React from "react";
import { createRoot } from "react-dom/client";
import DevicePanelApp from "./DevicePanelApp";

function mount() {
  let container = document.getElementById("root");
  if (!container) {
    container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);
  }
  const root = createRoot(container);
  root.render(<DevicePanelApp />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
