// Defensive guard: Ensure window.fetch is writable and configurable in sandbox/iframe environments
if (typeof window !== 'undefined') {
  try {
    const realFetch = window.fetch;
    if (realFetch) {
      try {
        Object.defineProperty(window, 'fetch', {
          value: realFetch,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        let _f = realFetch;
        Object.defineProperty(window, 'fetch', {
          get: () => _f,
          set: (val) => { _f = val; },
          configurable: true,
          enumerable: true,
        });
      }
      if (typeof Window !== 'undefined' && Window.prototype) {
        try {
          Object.defineProperty(Window.prototype, 'fetch', {
            get: () => window.fetch || realFetch,
            set: (val) => {
              try {
                window.fetch = val;
              } catch {
                // ignore
              }
            },
            configurable: true,
            enumerable: true,
          });
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ErrorBoundary} from './components/common/ErrorBoundary.tsx';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
