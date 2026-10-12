import { toAbsoluteUrl } from '@/utils';

/** Company identity used across the app. */
export const BRAND = {
  name: 'CoreVista',
  fullName: 'CoreVista Systems',
  product: 'RFID Inventory',
  tagline: 'Innovate | Integrate | Elevate',
  mark: '/media/app/corevista-mark.png',
  logo: '/media/app/corevista-logo.png'
};

interface BrandLogoProps {
  size?: number;
  /** Put the mark on a white rounded tile — needed on dark backgrounds (sidebar, login panel). */
  tile?: boolean;
  className?: string;
}

/** CoreVista "CV" mark. */
const BrandLogo = ({ size = 36, tile = false, className }: BrandLogoProps) => {
  const img = (
    <img
      src={toAbsoluteUrl(BRAND.mark)}
      alt={BRAND.fullName}
      width={tile ? Math.round(size * 0.82) : size}
      height={tile ? Math.round(size * 0.82) : size}
      className="object-contain"
      draggable={false}
    />
  );
  if (!tile) return <span className={`inline-flex shrink-0 ${className ?? ''}`}>{img}</span>;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {img}
    </span>
  );
};

/** Full CoreVista Systems logo (mark + wordmark + tagline) for light backgrounds. */
const BrandWordmark = ({ width = 220, className }: { width?: number; className?: string }) => (
  <img
    src={toAbsoluteUrl(BRAND.logo)}
    alt={BRAND.fullName}
    style={{ width }}
    className={`h-auto object-contain ${className ?? ''}`}
    draggable={false}
  />
);

export { BrandLogo, BrandWordmark };
