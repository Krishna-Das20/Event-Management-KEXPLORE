import { isRouteErrorResponse, useRouteError } from 'react-router';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Stub } from '@/components/layout/ErrorStub';

/** Router-level error boundary (e.g. a lazy chunk failed to load after a deploy). */
export default function RouteError() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Stub
        code={is404 ? '404' : 'Oops'}
        title={is404 ? 'Page not found' : 'Something went wrong'}
        body={is404 ? 'We couldn’t find that page.' : 'An unexpected error occurred. Reloading usually fixes it.'}
      >
        <Button variant="dark" onClick={() => window.location.reload()}>
          <RotateCw className="size-4" /> Reload
        </Button>
        <Button asChild variant="secondary">
          <a href="/">Go home</a>
        </Button>
      </Stub>
    </div>
  );
}
