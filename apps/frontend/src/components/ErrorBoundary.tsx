import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-cream/70 px-6 py-16">
        <div className="mx-auto max-w-xl rounded-sm border border-sepia/30 bg-parchment p-6 shadow-sm">
          <h1 className="font-headline text-xl text-ink-effect">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">
            We hit an unexpected error while loading this page. Try refreshing the editor or return
            to the previous screen.
          </p>
          {this.state.message ? (
            <div className="mt-4 rounded-sm border border-aged-red/30 bg-aged-red/10 px-3 py-2 text-xs text-aged-red">
              {this.state.message}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={this.handleReload}>
              Reload page
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
