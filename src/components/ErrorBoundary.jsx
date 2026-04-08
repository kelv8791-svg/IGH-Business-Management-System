import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-6 rounded-full mb-6">
            <AlertOctagon size={64} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Something went wrong rendering this view.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg">
            The application encountered unexpected or missing data that caused a crash. 
            This usually happens if a field is empty when a number was expected.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2 mb-6"
          >
            <RefreshCw size={20} />
            Reload Application
          </button>

          {/* Technical Details for easier debugging as requested */}
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg w-full max-w-3xl overflow-auto text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-bold text-red-600 dark:text-red-400 mb-2">Technical Error Details:</p>
            <p className="font-mono text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
            </p>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Component Stack Trace:</p>
            <pre className="font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-xs">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
