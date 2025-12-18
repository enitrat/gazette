import { TEMPLATES, CreateProjectSchema } from "@gazette/shared";

console.log("Frontend App initialized");
console.log("Available templates:", Object.values(TEMPLATES));

// Example schema usage
const result = CreateProjectSchema.safeParse({ name: "Test Project", password: "test123" });
console.log("Schema validation:", result.success);
