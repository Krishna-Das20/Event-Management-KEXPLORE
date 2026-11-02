import { useMemo, useRef, useState } from 'react';
import { Database, Download, FileJson, FileSpreadsheet, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { downloadText } from '@/lib/download';
import { useTicketStore } from '@/store/tickets';
import { useLibraryStore } from '@/store/saved';

const KEYS = ['encore.tickets', 'encore.library', 'encore.contact', 'encore.theme', 'encore.view', 'encore.newsletter'];
const QUOTA = 5 * 1024 * 1024; // typical per-origin Local Storage quota

function usageBytes() {
  return KEYS.reduce((sum, k) => sum + (localStorage.getItem(k)?.length ?? 0) * 2, 0); // UTF-16
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Everything the user can do with the data Encore keeps in their browser. */
export function DataTools() {
  const tickets = useTicketStore((s) => s.tickets);
  const clear = useTicketStore((s) => s.clear);
  const importBackup = useTicketStore((s) => s.importBackup);
  const savedCount = useLibraryStore((s) => s.saved.length);
  const fileRef = useRef(null);
  const [confirm, setConfirm] = useState(false);
  // Recomputed whenever the stored data changes.
  const bytes = useMemo(() => usageBytes(), [tickets, savedCount]); // eslint-disable-line react-hooks/exhaustive-deps
  const pct = Math.max(0.5, (bytes / QUOTA) * 100);
  const stamp = new Date().toISOString().slice(0, 10);

  const exportJson = () => {
    downloadText(JSON.stringify(tickets.map(({ payload: _p, ...t }) => t), null, 2), `encore-tickets-${stamp}.json`);
    toast.success('Backup downloaded', { description: `${tickets.length} tickets exported as JSON.` });
  };

  const exportCsv = () => {
    const header = ['Ticket code', 'Status', 'Event', 'Date', 'City', 'Name', 'Email', 'Phone', 'Tickets', 'Booked at'];
    const rows = tickets.map((t) =>
      [t.ticketCode, t.status, t.event?.title, t.event?.startDate, t.event?.venue?.city, t.name, t.email, t.phone, t.tickets, t.createdAt].map(csvCell).join(','),
    );
    downloadText([header.map(csvCell).join(','), ...rows].join('\n'), `encore-tickets-${stamp}.csv`, 'text/csv');
    toast.success('Spreadsheet downloaded', { description: 'Opens in Excel, Numbers or Google Sheets.' });
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const added = importBackup(JSON.parse(await file.text()));
      toast.success(added ? `Imported ${added} ticket${added > 1 ? 's' : ''}` : 'Nothing new to import', {
        description: added ? 'They now appear in your wallet.' : 'Every ticket in that file is already here.',
      });
    } catch (err) {
      toast.error('Import failed', { description: err instanceof SyntaxError ? 'That file isn’t valid JSON.' : err.message });
    }
  };

  return (
    <section aria-labelledby="data-tools" className="rounded-[28px] border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2">
          <Database className="size-5" />
        </span>
        <div>
          <h2 id="data-tools" className="font-display text-2xl font-bold tracking-tight">
            Your data on this device
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tickets, saved events and preferences are kept in your browser’s Local Storage, so they load instantly and work offline. Back them up or move them to
            another browser any time.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-muted">
          <span>
            {tickets.length} tickets · {savedCount} saved events
          </span>
          <span className="font-mono">{(bytes / 1024).toFixed(1)} KB of ~5 MB</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={exportJson} disabled={!tickets.length}>
          <FileJson className="size-4" /> Export JSON
        </Button>
        <Button variant="secondary" onClick={exportCsv} disabled={!tickets.length}>
          <FileSpreadsheet className="size-4" /> Export CSV
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Import backup
        </Button>
        <Button variant="secondary" onClick={() => setConfirm(true)} disabled={!tickets.length} className="hover:border-danger hover:text-danger">
          <Trash2 className="size-4" /> Clear tickets
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} aria-label="Import ticket backup" />

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Clear tickets from this device?"
        description="This only removes the local copies. Confirmed registrations stay valid on the server, and signing in with Google restores them."
        confirmLabel="Clear device data"
        onConfirm={() => {
          clear();
          setConfirm(false);
          toast('Device tickets cleared', { icon: <Download className="size-4 rotate-180" /> });
        }}
      />
    </section>
  );
}
