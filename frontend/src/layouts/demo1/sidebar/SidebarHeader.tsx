import { forwardRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components/keenicons';
import { SidebarToggle } from './';

/** Product mark shown in the sidebar and the mobile header. */
const BrandMark = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm ${
      size === 'sm' ? 'size-8' : 'size-9'
    }`}
  >
    <KeenIcon icon="scan-barcode" style="solid" className={size === 'sm' ? 'text-base' : 'text-lg'} />
  </span>
);

interface CompanyInfo {
  name: string;
  city?: string;
}

const SidebarHeader = forwardRef<HTMLDivElement>((_props, ref) => {
  const { pathname } = useLocation();
  const companyMatch = pathname.match(/\/admin\/company\/([^/]+)/);
  const companyId = companyMatch ? companyMatch[1] : null;
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (!companyId) {
      setCompany(null);
      return;
    }
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/company/${companyId}`)
      .then((res) => setCompany(res.data.data))
      .catch(() => setCompany(null));
  }, [companyId]);

  return (
    <div
      ref={ref}
      className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0"
    >
      <Link to="/" className="flex items-center gap-2.5 min-w-0">
        <span className="default-logo flex items-center gap-2.5 min-w-0">
          <BrandMark />
          <span className="flex flex-col min-w-0 leading-tight">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {company?.name ?? 'CVS RFID'}
            </span>
            <span className="text-2xs font-medium uppercase tracking-wider text-gray-500 truncate">
              {company?.city ?? 'Inventory Suite'}
            </span>
          </span>
        </span>
        <span className="small-logo">
          <BrandMark />
        </span>
      </Link>
      <SidebarToggle />
    </div>
  );
});

SidebarHeader.displayName = 'SidebarHeader';

export { SidebarHeader, BrandMark };
