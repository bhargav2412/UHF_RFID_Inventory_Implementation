import { FormEvent, ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { KeenIcon } from '@/components/keenicons';

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  onSubmit?: () => void;
  footer?: ReactNode;
  width?: string;
}

/**
 * Right-hand slide-over used for create/edit forms and record details.
 * Full width on phones, fixed width from `sm` up.
 */
const FormDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Save',
  onSubmit,
  footer,
  width = 'sm:max-w-[520px]'
}: FormDrawerProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" close={false} className={`w-full ${width} p-0 flex flex-col bg-light border-s border-gray-200`}>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-gray-200 px-5 py-4 text-start">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-base font-semibold text-gray-900">{title}</SheetTitle>
              <SheetDescription className="text-2sm text-gray-600">{description ?? ''}</SheetDescription>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <KeenIcon icon="cross" />
            </button>
          </SheetHeader>
          <div className="grow overflow-y-auto px-5 py-5 flex flex-col gap-4">{children}</div>
          <div className="flex items-center justify-end gap-2.5 border-t border-gray-200 px-5 py-3.5">
            {footer ?? (
              <>
                <button type="button" className="btn btn-light" onClick={() => onOpenChange(false)}>
                  Cancel
                </button>
                {onSubmit && (
                  <button type="submit" className="btn btn-primary">
                    {submitLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

const Field = ({ label, hint, required, children, className }: FieldProps) => (
  <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
    <label className="text-2sm font-medium text-gray-800">
      {label}
      {required && <span className="text-danger ms-0.5">*</span>}
    </label>
    {children}
    {hint && <span className="text-xs text-gray-500">{hint}</span>}
  </div>
);

/** Two-column label/value list used in detail drawers. */
const DetailList = ({ items }: { items: { label: string; value: ReactNode }[] }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
    {items.map((it) => (
      <div key={it.label} className="flex flex-col gap-0.5 min-w-0">
        <dt className="text-xs text-gray-500">{it.label}</dt>
        <dd className="text-2sm font-medium text-gray-900 break-words">{it.value ?? '—'}</dd>
      </div>
    ))}
  </dl>
);

export { FormDrawer, Field, DetailList };
