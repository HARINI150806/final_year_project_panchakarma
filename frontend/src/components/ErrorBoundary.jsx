import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleReload = () => {
    // Force refresh bypassing cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
    }
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f8f9f6] p-4 text-center font-sans">
          <div className="w-full max-w-md rounded-3xl border border-[#cfe0c2] bg-white p-8 shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              🌿
            </div>
            <h2 className="font-display text-2xl font-bold text-forest">
              Application Refresh Needed
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-forest/70">
              We encountered a temporary display issue. This usually happens after an app update or on mobile page refresh.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-98 cursor-pointer"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full rounded-2xl border border-forest/20 bg-white py-3 text-sm font-semibold text-forest transition hover:bg-forest/5 active:scale-98 cursor-pointer"
              >
                🏡 Go to Home Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
