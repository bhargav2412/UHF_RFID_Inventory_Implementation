import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';

export interface Crumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  icon?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  badge?: ReactNode;
}

/**
 * Consistent page title block: breadcrumb trail, icon, title, description and actions.
 * Actions wrap below the title on small screens.
 */
const PageHeader = ({ title, description, icon, crumbs, actions, badge }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-6 lg:pb-7.5">
    <div className="flex items-start gap-3.5 min-w-0">
      {icon && (
        <div className="hidden sm:flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary-clarity bg-primary-light text-primary">
          <KeenIcon icon={icon} className="text-xl" />
        </div>
      )}
      <div className="flex flex-col gap-1.5 min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-gray-500">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-1">
                {c.path ? (
                  <Link to={c.path} className="hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className={i === crumbs.length - 1 ? 'text-gray-700' : ''}>{c.label}</span>
                )}
                {i < crumbs.length - 1 && <KeenIcon icon="right" className="text-3xs text-gray-400" />}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold leading-tight text-gray-900">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-gray-600 max-w-2xl">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div>}
  </div>
);

export { PageHeader };
