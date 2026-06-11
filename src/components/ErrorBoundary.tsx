import React from 'react';

class ErrorBoundary extends React.Component<{
  fallback: React.ReactNode;
  onError: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}> {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
