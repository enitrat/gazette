import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="gazette-page rounded-md p-8 text-center">
        <h1 className="mb-4 text-ink-effect">La Gazette de la Vie</h1>
        <p className="font-subheading mb-8 text-lg text-muted">Where Memories Come to Life</p>
        <p className="mx-auto max-w-2xl text-ink">
          Bienvenue! Create beautiful, animated newspaper-style gazettes from your cherished
          photographs. Transform static memories into living stories that capture the essence of
          your family history.
        </p>
      </div>
    </div>
  );
}
