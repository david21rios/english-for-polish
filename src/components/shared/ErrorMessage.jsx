import React from "react";

/**
 * Global React error boundary.
 *
 * Captures rendering errors and displays
 * a friendly fallback screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "Error caught by ErrorBoundary:",
      error,
      errorInfo
    );

    // Future integration:
    // Sentry
    // Firebase Crashlytics
    // LogRocket
    // OpenTelemetry
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="max-w-lg text-center">

            <h1 className="text-3xl font-bold text-gray-900">
              Coś poszło nie tak
            </h1>

            <p className="mt-4 text-gray-600 leading-relaxed">
              W aplikacji wystąpił nieoczekiwany błąd.
              Odśwież stronę i spróbuj ponownie.
              Jeśli problem będzie się powtarzał,
              skontaktuj się z administratorem.
            </p>

            {import.meta.env.DEV &&
              this.state.error && (
                <pre
                  className="
                    mt-8
                    rounded-xl
                    bg-red-50
                    border
                    border-red-200
                    p-4
                    text-left
                    text-xs
                    text-red-700
                    overflow-auto
                  "
                >
                  {this.state.error.toString()}
                </pre>
              )}

            <button
              type="button"
              onClick={this.handleReload}
              className="
                mt-8
                inline-flex
                items-center
                justify-center
                rounded-lg
                bg-primary-600
                px-6
                py-3
                font-medium
                text-white
                transition-colors
                hover:bg-primary-700
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500
                focus:ring-offset-2
              "
            >
              Odśwież stronę
            </button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;