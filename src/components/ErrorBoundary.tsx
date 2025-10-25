import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary - Komponent zabezpieczający aplikację przed crashem
 *
 * Funkcjonalność:
 * - Przechwytuje błędy JavaScript w całym drzewie komponentów
 * - Wyświetla przyjazny komunikat błędu zamiast białego ekranu
 * - Loguje szczegóły błędu do konsoli (można wysłać do Sentry)
 * - Pozwala odświeżyć aplikację bez utraty danych z localStorage
 *
 * Użycie:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aktualizuj state żeby następny render pokazał fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Możesz tutaj wysłać błąd do serwisu monitoringu (np. Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Integracja z Sentry lub innym serwisem
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReload = () => {
    // Odśwież stronę
    window.location.reload();
  };

  handleReset = () => {
    // Reset state i spróbuj ponownie
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Możesz użyć custom fallback z props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Domyślny fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Coś poszło nie tak
            </h1>

            <p className="text-gray-600 text-center mb-6">
              Aplikacja napotkała nieoczekiwany błąd. Twoje dane są bezpieczne.
            </p>

            {/* Szczegóły błędu w trybie development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-auto">
                <p className="text-xs font-mono text-red-600 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Odśwież aplikację
              </button>

              <button
                onClick={this.handleReset}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Spróbuj ponownie
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              Jeśli problem się powtarza, skontaktuj się z administratorem
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
