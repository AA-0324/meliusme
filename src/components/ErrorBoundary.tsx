import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Optional label used in console logs to identify the boundary. */
  name?: string;
  /** When true, renders a minimal inline fallback (good for small widgets). */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary. Catches render-time errors in its subtree so a
 * single broken component cannot blank out the whole app.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    if (this.props.inline) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Something went wrong loading this section.
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. You can try again or reload the app.
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="flex-1 h-11 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
