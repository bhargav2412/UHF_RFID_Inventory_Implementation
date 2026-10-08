import { ReactNode } from 'react';
import { KeenIcon } from '@/components/keenicons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

const EmptyState = ({ icon = 'search-list', title, description, action, compact }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center gap-3 ${compact ? 'py-8' : 'py-14'} px-4`}>
    <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
      <KeenIcon icon={icon} className="text-2xl" />
    </div>
    <div className="flex flex-col gap-1">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      {description && <p className="text-2sm text-gray-600 max-w-sm">{description}</p>}
    </div>
    {action}
  </div>
);

const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
    <div className="size-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
    <span className="text-2sm">{label}</span>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <EmptyState
    icon="information-2"
    title="Something went wrong"
    description={message}
    action={
      onRetry && (
        <button className="btn btn-sm btn-light" onClick={onRetry}>
          Try again
        </button>
      )
    }
  />
);

export { EmptyState, LoadingState, ErrorState };
