import { greeting } from "@gazette/shared";

const server = Bun.serve({
  port: 3000,
  fetch() {
    return new Response(greeting("Backend Server"));
  },
});

console.log(`Server running at http://localhost:${server.port}`);
