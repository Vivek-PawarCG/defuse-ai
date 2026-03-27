import React from 'react';

/**
 * Global Error Boundary for the React Application.
 * Displays a diegetic "CRITICAL HARDWARE FAILURE" screen in case of a crash.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[React CRASH]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#050505',
          color: '#ff2a2a',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          padding: '2rem',
          textAlign: 'center',
          border: '4px solid #ff2a2a'
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0' }}>CRITICAL HARDWARE FAILURE</h1>
          <p style={{ margin: '1rem 0' }}>UPLINK DEGRADED. SECURE CHANNEL COMPROMISED.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'transparent',
              color: '#ff2a2a',
              border: '1px solid #ff2a2a',
              padding: '0.8rem 1.5rem',
              cursor: 'pointer',
              marginTop: '2rem'
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
