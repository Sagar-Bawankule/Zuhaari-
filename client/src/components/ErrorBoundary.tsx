import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('zuhaari_room');
      localStorage.removeItem('zuhaari_session');
      localStorage.removeItem('cutpatti_room');
      localStorage.removeItem('cutpatti_session');
    } catch {
      // ignore
    }
    window.location.hash = '';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-charcoal-950 text-white font-body flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-700/60 flex items-center justify-center text-3xl mb-4 shadow-xl">
            ⚠️
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ivory-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-charcoal-400 max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while loading or updating the table view. You can reload or reset your active game room session.
          </p>

          {this.state.error && (
            <div className="max-w-md w-full bg-charcoal-900/90 border border-charcoal-800 rounded-xl p-3 mb-6 text-left">
              <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block font-semibold mb-1">
                Error Details
              </span>
              <p className="text-xs font-mono text-red-300 break-words">
                {this.state.error.message || String(this.state.error)}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-charcoal-950 transition-colors shadow-lg"
            >
              Reload Page 🔄
            </button>
            <button
              onClick={this.handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-display font-semibold text-xs text-charcoal-300 hover:text-ivory-100 bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 transition-colors"
            >
              Reset Session & Home 🏠
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
