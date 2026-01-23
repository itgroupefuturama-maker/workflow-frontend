import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }> {
  state = { hasError: false, error: null as any };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error Boundary caught:', error, errorInfo);
    // Tu peux envoyer à Sentry ou un log ici plus tard
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 text-red-500">
            <h2>Une erreur est survenue dans cette section.</h2>
            <p>{this.state.error?.message || 'Détails inconnus'}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
              Réessayer
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;