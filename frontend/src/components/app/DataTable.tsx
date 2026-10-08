import clsx from 'clsx';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { KeenIcon } from '@/components/keenicons';
import { EmptyState, LoadingState } from './EmptyState';
import { downloadCsv } from './format';

export interface Column<T> {
  key: string;
  header: string;
  /** Custom cell renderer. Defaults to `row[key]`. */
  render?: (row: T) => ReactNode;
  /** Value used for sorting and CSV export. Defaults to `row[key]`. */
  value?: (row: T) => string | number | undefined;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
  /** Hide this column from the stacked mobile card. */
  hideOnMobile?: boolean;
  /** Use this column as the title line of the mobile card. */
  primary?: boolean;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match?: (row: T, value: string) => boolean;
}

interface DataTableProps<T> {
  title?: ReactNode;
  subtitle?: ReactNode;
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | ((row: T) => string | undefined))[];
  filters?: FilterDef<T>[];
  toolbar?: ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  exportName?: string;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  className?: string;
}

const alignClass = { start: 'text-start', center: 'text-center', end: 'text-end' };

/**
 * Responsive data table with search, select filters, sorting, pagination and CSV export.
 * Renders a classic table from `md` up and stacked cards on phones.
 */
function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  rowKey,
  loading,
  searchPlaceholder = 'Search…',
  searchKeys,
  filters = [],
  toolbar,
  pageSize = 10,
  onRowClick,
  rowActions,
  exportName,
  emptyTitle = 'No records found',
  emptyDescription = 'Try changing the search text or filters.',
  emptyAction,
  initialSort,
  className
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

  const cellValue = (row: T, col: Column<T>) =>
    col.value ? col.value(row) : ((row as Record<string, unknown>)[col.key] as string | number | undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data;
    if (q && searchKeys?.length) {
      rows = rows.filter((row) =>
        searchKeys.some((k) => {
          const v = typeof k === 'function' ? k(row) : (row[k] as unknown);
          return v !== undefined && v !== null && String(v).toLowerCase().includes(q);
        })
      );
    }
    for (const f of filters) {
      const val = filterValues[f.key];
      if (!val) continue;
      rows = rows.filter((row) =>
        f.match ? f.match(row, val) : String((row as Record<string, unknown>)[f.key]) === val
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const av = cellValue(a, col);
          const bv = cellValue(b, col);
          if (av === bv) return 0;
          if (av === undefined) return 1;
          if (bv === undefined) return -1;
          const cmp =
            typeof av === 'number' && typeof bv === 'number'
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, filterValues, sort, columns]);

  useEffect(() => setPage(1), [search, filterValues, size]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  const hasFilters = search !== '' || Object.values(filterValues).some(Boolean);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const exportCsv = () =>
    downloadCsv(
      exportName ?? 'export',
      filtered.map((row) =>
        Object.fromEntries(columns.map((c) => [c.header, cellValue(row, c) ?? '']))
      )
    );

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];

  return (
    <div className={clsx('card min-w-0', className)}>
      {(title || toolbar) && (
        <div className="card-header flex-wrap gap-3 py-4">
          <div className="flex flex-col gap-0.5">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
          </div>
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {(searchKeys || filters.length > 0 || exportName) && (
        <div className="flex flex-col gap-2.5 border-b border-gray-200 px-4 py-3 lg:px-5 md:flex-row md:items-center">
          {searchKeys && (
            <label className="input input-sm md:max-w-xs grow">
              <KeenIcon icon="magnifier" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label="Search"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-700" aria-label="Clear search">
                  <KeenIcon icon="cross" className="text-xs" />
                </button>
              )}
            </label>
          )}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {filters.map((f) => (
              <select
                key={f.key}
                className="select select-sm sm:w-40"
                value={filterValues[f.key] ?? ''}
                onChange={(e) => setFilterValues((v) => ({ ...v, [f.key]: e.target.value }))}
                aria-label={f.label}
              >
                <option value="">All {f.label.toLowerCase()}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ))}
            {hasFilters && (
              <button
                className="btn btn-sm btn-link"
                onClick={() => {
                  setSearch('');
                  setFilterValues({});
                }}
              >
                Reset
              </button>
            )}
          </div>
          {exportName && (
            <button className="btn btn-sm btn-light md:ms-auto" onClick={exportCsv} disabled={!filtered.length}>
              <KeenIcon icon="exit-down" /> Export CSV
            </button>
          )}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden md:block scrollable-x-auto">
            <table className="table table-border align-middle text-gray-700 text-2sm">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={clsx('whitespace-nowrap', alignClass[col.align ?? 'start'], col.className)}
                    >
                      {col.sortable ? (
                        <button
                          className="inline-flex items-center gap-1 hover:text-gray-900"
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.header}
                          <KeenIcon
                            icon={sort?.key === col.key ? (sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'}
                            className={clsx('text-2xs', sort?.key === col.key ? 'text-primary' : 'text-gray-400')}
                          />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                  {rowActions && <th className="w-[60px] text-end">&nbsp;</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={clsx(onRowClick && 'cursor-pointer hover:bg-gray-50')}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={clsx(alignClass[col.align ?? 'start'], col.className)}>
                        {col.render ? col.render(row) : (cellValue(row, col) ?? '—')}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {rows.map((row) => (
              <div
                key={rowKey(row)}
                className={clsx('flex flex-col gap-2 px-4 py-3.5', onRowClick && 'active:bg-gray-50')}
                onClick={() => onRowClick?.(row)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium text-gray-900 min-w-0">
                    {primaryCol.render ? primaryCol.render(row) : cellValue(row, primaryCol)}
                  </div>
                  {rowActions && <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {columns
                    .filter((c) => c !== primaryCol && !c.hideOnMobile)
                    .map((col) => (
                      <div key={col.key} className="flex flex-col min-w-0">
                        <dt className="text-2xs uppercase tracking-wide text-gray-500">{col.header}</dt>
                        <dd className="text-2sm text-gray-800 truncate">
                          {col.render ? col.render(row) : (cellValue(row, col) ?? '—')}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="card-footer flex-col gap-3 sm:flex-row sm:justify-between text-2sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <select
                className="select select-sm w-[72px]"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                aria-label="Rows per page"
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline">
                {(current - 1) * size + 1}–{Math.min(current * size, filtered.length)} of {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="btn btn-sm btn-icon btn-light"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                aria-label="Previous page"
              >
                <KeenIcon icon="black-left" />
              </button>
              <span className="px-3 font-medium text-gray-800">
                {current} / {pages}
              </span>
              <button
                className="btn btn-sm btn-icon btn-light"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                aria-label="Next page"
              >
                <KeenIcon icon="black-right" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { DataTable };
