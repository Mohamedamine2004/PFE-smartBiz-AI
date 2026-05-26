import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import i18n from '../i18n/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors in descendant components and shows a fallback UI
 * instead of crashing the entire application with a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="card max-w-md w-full text-center space-y-4">
            <div className="icon-circle mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="section-heading">{i18n.t('errorBoundary.title', 'Something went wrong')}</h1>
            <p className="text-helper">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mx-auto px-6"
            >
              {i18n.t('errorBoundary.reload', 'Reload Page')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
