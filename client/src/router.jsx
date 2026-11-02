import { createBrowserRouter } from 'react-router';
import RootLayout from '@/components/layout/RootLayout';
import Home from '@/pages/Home';
import RouteError from '@/pages/RouteError';

// Pages other than Home are code-split and loaded on demand.
const page = (loader) => async () => ({ Component: (await loader()).default });

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: null,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', lazy: page(() => import('@/pages/Events')) },
      { path: 'events/:slug', lazy: page(() => import('@/pages/EventDetail')) },
      { path: 'register', lazy: page(() => import('@/pages/Register')) },
      { path: 'tickets', lazy: page(() => import('@/pages/MyTickets')) },
      { path: 'verify/:code?', lazy: page(() => import('@/pages/Verify')) },
      { path: 'privacy', lazy: page(() => import('@/pages/Legal').then((m) => ({ default: m.Privacy }))) },
      { path: 'terms', lazy: page(() => import('@/pages/Legal').then((m) => ({ default: m.Terms }))) },
      { path: '*', lazy: page(() => import('@/pages/NotFound')) },
    ],
  },
]);
