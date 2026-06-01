import React from 'react';

interface State { hasError: boolean; error?: Error }

/**
 * Catches render-time errors so a thrown exception doesn't blank the
 * screen or trigger a full reload. Shows a recover button instead.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full bg-card border border-border rounded-3xl p-6 text-center">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-5">
            We caught an unexpected error before it could break the app.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={this.handleReset}
              className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold"
            >
              Try again
            </button>
            <button
              onClick={this.handleReset}
              className="w-full h-11 rounded-2xl bg-secondary text-foreground font-medium"
            >
              Stay in app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
