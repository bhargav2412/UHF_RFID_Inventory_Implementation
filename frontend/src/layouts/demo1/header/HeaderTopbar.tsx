import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { Menu, MenuItem, MenuToggle } from '@/components';
import { DropdownUser } from '@/partials/dropdowns/user';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/i18n';
import { useAuthContext } from '@/auth';
import { StatusBadge, timeAgo } from '@/components/app';
import { alerts, readers } from '@/services/mock/data';
import { HeaderSearch } from './HeaderSearch';

const SEVERITY_ICON: Record<string, string> = {
  critical: 'text-danger',
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-info'
};

/** Header bell: unresolved alerts with a link to the Alert Center. */
const AlertsPopover = () => {
  const [open, setOpen] = useState(false);
  const active = alerts.filter((a) => a.status === 'new');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="btn btn-icon btn-icon-lg relative size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-600"
          aria-label={`Alerts (${active.length} new)`}
        >
          <KeenIcon icon="notification-status" />
          {active.length > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-[--tw-page-bg]">
              {active.length > 9 ? '9+' : active.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[calc(100vw-2rem)] sm:w-[380px] p-0 bg-light border-gray-200 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Alerts</span>
            <span className="badge badge-xs badge-danger">{active.length} new</span>
          </div>
          <Link to="/alerts" className="text-2sm font-medium text-primary hover:underline" onClick={() => setOpen(false)}>
            Open Alert Center
          </Link>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
          {active.slice(0, 7).map((a) => (
            <Link
              key={a.id}
              to={`/alerts?type=${a.type}`}
              onClick={() => setOpen(false)}
              className="flex gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <KeenIcon icon="information-2" className={`mt-0.5 text-lg ${SEVERITY_ICON[a.severity]}`} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2sm font-medium text-gray-900 truncate">{a.title}</span>
                  <StatusBadge status={a.severity} dot={false} className="badge-xs" />
                </div>
                <span className="text-xs text-gray-600 line-clamp-2">{a.message}</span>
                <span className="text-2xs text-gray-500">
                  {a.location} · {timeAgo(a.createdAt)}
                </span>
              </div>
            </Link>
          ))}
          {active.length === 0 && <div className="px-4 py-8 text-center text-2sm text-gray-500">You're all caught up.</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Compact reader-health pill (desktop). */
const ReaderStatusPill = () => {
  const online = readers.filter((r) => r.status === 'online').length;
  const offline = readers.filter((r) => r.status === 'offline').length;
  return (
    <Link
      to="/tracking/live"
      className="hidden xl:flex items-center gap-2 rounded-full border border-gray-200 bg-light px-3 py-1.5 text-2sm text-gray-700 hover:border-gray-300"
      title="Reader status"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span className="font-medium text-gray-900">{online}</span>/{readers.length} readers online
      {offline > 0 && <span className="badge badge-xs badge-danger">{offline} offline</span>}
    </Link>
  );
};

const HeaderTopbar = () => {
  const { isRTL } = useLanguage();
  const { currentUser } = useAuthContext();
  const itemUserRef = useRef<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const initials =
    `${currentUser?.first_name?.[0] ?? ''}${currentUser?.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-1.5 lg:gap-3 shrink-0">
      <ReaderStatusPill />

      {/* Mobile search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <button
            className="md:hidden btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-600"
            aria-label="Search"
          >
            <KeenIcon icon="magnifier" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="w-[calc(100vw-2rem)] p-3 bg-light border-gray-200 rounded-xl">
          <HeaderSearch autoFocus className="max-w-none" onDone={() => setSearchOpen(false)} />
        </PopoverContent>
      </Popover>

      <Link
        to="/dashboard/mobile"
        className="hidden sm:inline-flex btn btn-sm btn-light"
        title="Open scanner view"
      >
        <KeenIcon icon="scan-barcode" /> Scan
      </Link>

      <AlertsPopover />

      <Menu>
        <MenuItem
          ref={itemUserRef}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: isRTL() ? 'bottom-start' : 'bottom-end',
            modifiers: [{ name: 'offset', options: { offset: isRTL() ? [-20, 10] : [20, 10] } }]
          }}
        >
          <MenuToggle className="btn btn-icon rounded-full">
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-success bg-primary-light text-2sm font-semibold text-primary">
              {initials}
            </span>
          </MenuToggle>
          {DropdownUser({ menuItemRef: itemUserRef })}
        </MenuItem>
      </Menu>
    </div>
  );
};

export { HeaderTopbar };
