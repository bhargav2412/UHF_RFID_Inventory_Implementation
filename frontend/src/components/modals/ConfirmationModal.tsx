import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components/keenicons';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const ConfirmationModal = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader className="flex flex-col items-center pt-8 pb-4">
          <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary'}`}>
            <KeenIcon icon={variant === 'danger' ? 'trash' : 'check'} className="text-3xl" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-center text-gray-600 px-4 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-3 p-6 pt-0 border-0">
          <button
            type="button"
            className="btn btn-light flex-1"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ConfirmationModal };
