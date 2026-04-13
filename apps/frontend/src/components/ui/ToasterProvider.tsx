import { Toaster } from 'react-hot-toast';

/**
 * Global toaster provider — place once at the app root.
 * Uses the project's design tokens for consistent styling.
 */
export const ToasterProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: 'var(--color-surface, #1e1e2e)',
        color: 'var(--color-text-main, #e0e0e0)',
        border: '1px solid var(--color-border, #333)',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      },
      success: {
        iconTheme: {
          primary: '#22c55e',
          secondary: '#1e1e2e',
        },
        style: {
          border: '1px solid rgba(34,197,94,0.25)',
        },
      },
      error: {
        iconTheme: {
          primary: '#ef4444',
          secondary: '#1e1e2e',
        },
        style: {
          border: '1px solid rgba(239,68,68,0.25)',
        },
      },
    }}
  />
);
