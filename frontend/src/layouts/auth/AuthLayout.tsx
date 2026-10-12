import { Fragment } from 'react';
import { Outlet } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { BRAND, BrandLogo } from '@/components/app/BrandLogo';
import useBodyClasses from '@/hooks/useBodyClasses';
import { AuthLayoutProvider } from './AuthLayoutProvider';

const FEATURES = [
  { icon: 'scan-barcode', title: 'Real-time RFID tracking', text: 'Every tag read from gates, fixed and handheld readers.' },
  { icon: 'cube-3', title: 'Accurate inventory', text: 'Cycle counts and variance reports without stopping work.' },
  { icon: 'shield-tick', title: 'Loss prevention', text: 'Instant alerts for missing items and unauthorised exits.' }
];

/** Navy brand panel — same colour as the application sidebar. */
const BrandPanel = () => (
  <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0f172a] p-10 xl:p-14 text-white">
    {/* Decorative RFID wave rings */}
    <svg
      className="pointer-events-none absolute -end-40 -bottom-40 size-[620px] opacity-[0.08]"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
    >
      {[30, 50, 70, 90].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} stroke="white" strokeWidth="1" />
      ))}
      <circle cx="100" cy="100" r="10" fill="white" />
    </svg>
    <div className="pointer-events-none absolute -start-24 -top-24 size-72 rounded-full bg-primary opacity-20 blur-3xl" />

    <div className="relative flex items-center gap-3">
      <BrandLogo size={52} tile />
      <div className="flex flex-col leading-tight gap-1">
        <span className="text-lg font-bold tracking-[0.12em]">
          CORE<span className="text-[#3b9cff]">VISTA</span>
        </span>
        <span className="text-2xs font-medium uppercase tracking-[0.35em] text-[#94a3b8]">Systems</span>
      </div>
    </div>

    <div className="relative flex flex-col gap-8 max-w-md">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-semibold leading-tight">
          UHF RFID inventory &amp; asset management
        </h2>
        <p className="text-sm text-[#cbd5e1] leading-relaxed">
          Track stock, assets and movements across every warehouse in real time — from receiving dock to dispatch gate.
        </p>
      </div>
      <ul className="flex flex-col gap-5">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
              <KeenIcon icon={f.icon} className="text-lg" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{f.title}</span>
              <span className="text-xs text-[#94a3b8]">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>

    <div className="relative flex items-center justify-between text-xs text-[#64748b]">
      <span>© {new Date().getFullYear()} {BRAND.fullName} · {BRAND.tagline}</span>
      <span className="flex items-center gap-1.5">
        <KeenIcon icon="lock-2" className="text-sm" /> Secured connection
      </span>
    </div>
  </div>
);

const Layout = () => {
  useBodyClasses('bg-[#f6f8fb] dark:bg-coal-500');

  return (
    <Fragment>
      <div className="grid grow min-h-screen lg:grid-cols-[minmax(420px,5fr)_7fr]">
        <BrandPanel />

        <div className="flex flex-col min-h-screen">
          {/* Compact brand bar for phones/tablets */}
          <div className="flex lg:hidden items-center gap-2.5 bg-[#0f172a] px-5 py-4 text-white">
            <BrandLogo size={34} tile />
            <span className="text-sm font-bold tracking-wider">
              CORE<span className="text-[#3b9cff]">VISTA</span>
            </span>
            <span className="text-2xs font-medium uppercase tracking-wider text-[#94a3b8]">RFID Inventory</span>
          </div>

          <div className="flex grow items-center justify-center px-5 py-10 sm:px-10">
            <Outlet />
          </div>

          <div className="lg:hidden px-5 pb-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {BRAND.fullName}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const AuthLayout = () => (
  <AuthLayoutProvider>
    <Layout />
  </AuthLayoutProvider>
);

export { AuthLayout };
