const numberFmt = new Intl.NumberFormat('en-IN');
const compactFmt = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export const fmtNumber = (value?: number | null) =>
  value === undefined || value === null ? '—' : numberFmt.format(value);

export const fmtCompact = (value?: number | null) =>
  value === undefined || value === null ? '—' : compactFmt.format(value);

export const fmtCurrency = (value?: number | null, compact = false) => {
  if (value === undefined || value === null) return '—';
  if (compact) return `₹${compactFmt.format(value)}`;
  return currencyFmt.format(value);
};

export const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—';

export const timeAgo = (iso?: string) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const future = diff < 0;
  const sec = Math.abs(diff) / 1000;
  if (sec < 45) return future ? 'in a moment' : 'just now';
  const steps: [number, string][] = [
    [60, 'm'],
    [3600, 'h'],
    [86400, 'd'],
    [2592000, 'mo'],
    [31536000, 'y']
  ];
  let label = 'm';
  let value = sec / 60;
  for (const [size, unit] of steps) {
    if (sec >= size) {
      label = unit;
      value = sec / size;
    }
  }
  const n = Math.max(1, Math.floor(value));
  return future ? `in ${n}${label}` : `${n}${label} ago`;
};

export const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

export const titleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const shortEpc = (epc?: string, size = 8) =>
  !epc ? '—' : epc.length <= size * 2 + 1 ? epc : `${epc.slice(0, size)}…${epc.slice(-size)}`;

export const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join(
    '\n'
  );
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
