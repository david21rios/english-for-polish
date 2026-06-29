// src/components/ErrorMessage.jsx
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
    console.error('Error caught by boundary:', error, errorInfo);
    // Aquí podrías implementar un servicio de logging de errores
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
            <p className="text-gray-600">
              Por favor, recarga la página o contacta soporte si el problema persiste.
            </p>
                  
            {import.meta.env.DEV && (
              <pre className="mt-4 p-4 bg-red-50 text-left text-xs overflow-auto rounded">
                {this.state.error?.toString()}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;