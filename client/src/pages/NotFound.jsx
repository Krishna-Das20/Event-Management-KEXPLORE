import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Stub } from '@/components/layout/ErrorStub';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <Stub code="404" title="This page doesn’t exist (yet)" body="The link may be broken, or the event has moved. Let’s get you back to the good stuff.">
      <Button asChild variant="dark">
        <Link to="/">
          <ArrowLeft className="size-4" /> Back home
        </Link>
      </Button>
      <Button asChild variant="secondary">
        <Link to="/events">Browse events</Link>
      </Button>
    </Stub>
  );
}
