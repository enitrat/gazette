import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="gazette-page rounded-md p-8">
        <h2 className="mb-6 text-center text-ink-effect">Sign In</h2>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-ui text-sm text-muted">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full rounded-sm border border-muted/30 bg-cream px-3 py-2 font-ui text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block font-ui text-sm text-muted">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full rounded-sm border border-muted/30 bg-cream px-3 py-2 font-ui text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-sm bg-gold px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:bg-gold/90"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center font-ui text-sm text-muted">
          Don't have an account?{" "}
          <a href="#" className="text-sepia hover:text-gold">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
