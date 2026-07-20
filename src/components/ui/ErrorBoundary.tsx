import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f9f9ff] px-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-error-container">
            <AlertTriangle className="size-7 text-on-error-container" />
          </span>
          <h1 className="font-heading text-2xl font-semibold text-on-surface">
            Something went wrong
          </h1>
          <p className="max-w-md font-body text-sm text-on-surface-variant">
            An unexpected error occurred and this page couldn't be displayed.
            Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-primary px-6 py-3 font-body text-sm font-semibold text-on-primary"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
