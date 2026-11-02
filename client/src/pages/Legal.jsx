import { Link } from 'react-router';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SITE } from '@/lib/constants';

function LegalPage({ eyebrow, title, updated, sections }) {
  return (
    <div className="container-x max-w-3xl pt-32 pb-10">
      <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
      <h1 className="font-display-tight text-[clamp(2.6rem,6vw,4.5rem)] font-extrabold">{title}</h1>
      <p className="mt-3 text-sm text-muted">Last updated {updated}</p>
      <div className="mt-12 space-y-10">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-2xl font-bold tracking-tight">{s.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-fg-2">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Privacy() {
  useDocumentTitle('Privacy policy');
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="2 November 2026"
      sections={[
        {
          heading: 'What we collect',
          body: (
            <p>
              When you register for an event we store the name, email address, mobile number and ticket count you enter, along with the event you chose. If you sign in
              with Google we receive your name, email address and profile photo — nothing else. We never see or store your Google password.
            </p>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <p>
              Your details are used only to issue and verify your ticket, to let you manage your registrations, and (if you subscribe) to send the weekly events
              newsletter. We do not sell or share personal data with advertisers.
            </p>
          ),
        },
        {
          heading: 'Data stored on your device',
          body: (
            <p>
              Encore keeps a copy of your tickets, saved events, contact details for faster forms, and your theme preference in your browser’s Local Storage. You can
              export or delete this data at any time from <Link to="/tickets" className="underline underline-offset-4">My Tickets</Link>.
            </p>
          ),
        },
        {
          heading: 'Cookies',
          body: <p>We use a single, essential, http-only session cookie to keep you signed in. There are no tracking or advertising cookies.</p>,
        },
        {
          heading: 'Contact',
          body: (
            <p>
              Questions? Open an issue on our{' '}
              <a href={SITE.repo} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                GitHub repository
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}

export function Terms() {
  useDocumentTitle('Terms of service');
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      updated="2 November 2026"
      sections={[
        {
          heading: 'About Encore',
          body: (
            <p>
              Encore is a student project built for the K Explore Web Designing task. Events listed are demonstration content; registering does not create a commercial
              contract with any organiser.
            </p>
          ),
        },
        {
          heading: 'Registrations',
          body: (
            <p>
              Each email address can hold one active registration per event, with up to five tickets. Please provide accurate details so your ticket can be verified at
              the entrance. You may cancel any upcoming registration from My Tickets.
            </p>
          ),
        },
        {
          heading: 'Acceptable use',
          body: <p>Don’t abuse the service — automated bulk registrations, scraping or attempts to disrupt the platform may be rate-limited or blocked.</p>,
        },
        {
          heading: 'Liability',
          body: <p>The service is provided “as is”, without warranties of any kind. Event details may change; always check with the organiser.</p>,
        },
      ]}
    />
  );
}
