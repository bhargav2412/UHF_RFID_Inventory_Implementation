import clsx from 'clsx';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';

/**
 * Global search: EPC, SKU or item name. Jumps to Item Tracking with the query.
 */
const HeaderSearch = ({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) => {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    navigate(`/tracking/item?q=${encodeURIComponent(q)}`);
    setValue('');
    onDone?.();
  };

  return (
    <form onSubmit={submit} className={clsx('grow max-w-md', className)} role="search">
      <label className="input input-sm w-full bg-light">
        <KeenIcon icon="magnifier" />
        <input
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search EPC, SKU or item name…"
          aria-label="Search inventory"
        />
        <span className="hidden xl:inline-flex badge badge-xs badge-outline font-mono">Enter</span>
      </label>
    </form>
  );
};

export { HeaderSearch };
