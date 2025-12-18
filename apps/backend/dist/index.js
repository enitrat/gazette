// @bun
// ../../packages/shared/src/index.ts
var greeting = (name) => {
  return `Hello, ${name}!`;
};

// src/index.ts
var server = Bun.serve({
  port: 3000,
  fetch() {
    return new Response(greeting("Backend Server"));
  }
});
console.log(`Server running at http://localhost:${server.port}`);
