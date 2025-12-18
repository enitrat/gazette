import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VibeKanbanWebCompanion } from "vibe-kanban-web-companion";
import { TEMPLATES, CreateProjectSchema } from "@gazette/shared";

console.log("Frontend App initialized");
console.log("Available templates:", Object.values(TEMPLATES));

// Example schema usage
const result = CreateProjectSchema.safeParse({
  name: "Test Project",
  password: "test123",
});
console.log("Schema validation:", result.success);

// Create root element if it doesn't exist
let rootElement = document.getElementById("root");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

// Render app with VibeKanbanWebCompanion
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <VibeKanbanWebCompanion />
    <div>
      <h1>Gazette Frontend</h1>
      <p>Available templates: {Object.values(TEMPLATES).join(", ")}</p>
    </div>
  </StrictMode>
);
