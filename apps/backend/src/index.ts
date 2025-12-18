import { TEMPLATES } from "@gazette/shared";

const server = Bun.serve({
  port: 3000,
  fetch() {
    return new Response(
      JSON.stringify({ message: "Backend Server", templates: Object.values(TEMPLATES) }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});

console.log(`Server running at http://localhost:${server.port}`);
