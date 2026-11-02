import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MotionConfig } from 'motion/react';
import { Tooltip } from 'radix-ui';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { router } from '@/router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => (err?.status >= 400 && err?.status < 500 ? false : count < 2),
    },
  },
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const withGoogle = (children) => (clientId ? <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider> : children);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {withGoogle(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <Tooltip.Provider delayDuration={200}>
              <RouterProvider router={router} />
            </Tooltip.Provider>
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>,
    )}
  </StrictMode>,
);
