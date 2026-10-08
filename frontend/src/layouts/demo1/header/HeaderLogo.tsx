import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { useDemo1Layout } from '../';
import { BrandMark } from '../sidebar/SidebarHeader';

/** Mobile-only: hamburger that opens the sidebar drawer + brand mark. */
const HeaderLogo = () => {
  const { setMobileSidebarOpen } = useDemo1Layout();

  return (
    <div className="flex lg:hidden items-center gap-2 -ms-1 shrink-0">
      <button
        type="button"
        className="btn btn-icon btn-light btn-clear btn-sm"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <KeenIcon icon="burger-menu-2" className="text-xl" />
      </button>
      <Link to="/" className="flex items-center gap-2">
        <BrandMark size="sm" />
        <span className="hidden sm:block text-sm font-semibold text-gray-900">CVS RFID</span>
      </Link>
    </div>
  );
};

export { HeaderLogo };
