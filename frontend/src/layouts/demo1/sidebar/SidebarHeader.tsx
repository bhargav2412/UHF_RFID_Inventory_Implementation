import { forwardRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BRAND, BrandLogo } from '@/components/app/BrandLogo';
import { SidebarToggle } from './';

/** Product mark shown in the sidebar and the mobile header. */
const BrandMark = ({ size = 'md', tile = true }: { size?: 'sm' | 'md'; tile?: boolean }) => (
  <BrandLogo size={size === 'sm' ? 32 : 38} tile={tile} />
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
            {company?.name ? (
              <span className="text-sm font-semibold text-gray-900 truncate">{company.name}</span>
            ) : (
              <span className="text-sm font-bold tracking-wide text-gray-900 truncate">
                CORE<span className="text-primary">VISTA</span>
              </span>
            )}
            <span className="text-2xs font-medium uppercase tracking-wider text-gray-500 truncate">
              {company?.city ?? BRAND.product}
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
