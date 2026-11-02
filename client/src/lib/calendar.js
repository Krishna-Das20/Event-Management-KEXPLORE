import { SITE } from './constants';

const stamp = (date) => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const location = (event) =>
  event.mode === 'online' ? 'Online' : [event.venue?.name, event.venue?.address, event.venue?.city].filter(Boolean).join(', ');

/** Google Calendar "add event" link. */
export function googleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(event.startDate)}/${stamp(event.endDate)}`,
    details: `${event.tagline ?? ''}\n\n${SITE.url}/events/${event.slug}`,
    location: location(event),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const escapeIcs = (s = '') => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Download a standards-compliant .ics file (Apple Calendar, Outlook, etc.). */
export function downloadIcs(event, ticketCode) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Encore//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ticketCode ?? event.slug}@encore-events`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.startDate)}`,
    `DTEND:${stamp(event.endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`${event.tagline ?? ''}${ticketCode ? `\nTicket: ${ticketCode}` : ''}\n${SITE.url}/events/${event.slug}`)}`,
    `LOCATION:${escapeIcs(location(event))}`,
    `URL:${SITE.url}/events/${event.slug}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(event.title)} starts in 2 hours`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${event.slug}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
