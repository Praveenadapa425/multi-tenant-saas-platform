import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
    }

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            padding: '20px'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '40px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '20px',
                color: '#dc3545'
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                color: '#333',
                marginTop: '0',
                marginBottom: '15px',
                fontSize: '24px'
              }}
            >
              Oops! Something went wrong
            </h1>

            <p
              style={{
                color: '#666',
                marginBottom: '10px',
                fontSize: '16px'
              }}
            >
              We're sorry for the inconvenience. An unexpected error has occurred.
            </p>

            <p
              style={{
                color: '#999',
                fontSize: '14px',
                marginBottom: '20px'
              }}
            >
              {this.state.errorCount > 1 && `Error count: ${this.state.errorCount}`}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <summary
                  style={{
                    color: '#721c24',
                    fontWeight: 'bold',
                    marginBottom: '10px'
                  }}
                >
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    color: '#721c24',
                    overflow: 'auto',
                    fontSize: '12px',
                    margin: '10px 0 0 0'
                  }}
                >
                  <strong>Error:</strong> {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Stack Trace:</strong>
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.resetError}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '10px',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#5568d3';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#667eea';
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                backgroundColor: '#e0e0e0',
                color: '#333',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#d0d0d0';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#e0e0e0';
              }}
            >
              Go to Home
            </button>

            <p
              style={{
                color: '#999',
                fontSize: '12px',
                marginTop: '20px'
              }}
            >
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
