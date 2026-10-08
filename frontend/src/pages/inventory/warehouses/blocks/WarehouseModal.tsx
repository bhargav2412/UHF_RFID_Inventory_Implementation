import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Alert } from '@/components/alert/Alert';

export interface Warehouse {
  _id?: string;
  warehouse_id: string;
  name: string;
  location?: string;
  current_stock?: number;
}

interface WarehouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
  onSuccess: () => void;
}

const validationSchema = Yup.object().shape({
  warehouse_id: Yup.string().required('Warehouse ID is required'),
  name: Yup.string().required('Name is required'),
  location: Yup.string().optional()
});

const defaultValues: Warehouse = {
  warehouse_id: '',
  name: '',
  location: ''
};

const WarehouseModal = ({ open, onOpenChange, warehouse, onSuccess }: WarehouseModalProps) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: warehouse ? { ...warehouse } : defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const payload = {
          warehouse_id: values.warehouse_id,
          name: values.name,
          location: values.location || undefined
        };
        if (warehouse?._id) {
          await axios.patch(`${import.meta.env.VITE_APP_API_URL}/stock/warehouses/${warehouse._id}`, {
            name: payload.name,
            location: payload.location
          });
          toast.success('Warehouse updated successfully');
        } else {
          await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/warehouses`, payload);
          toast.success('Warehouse created successfully');
        }
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save failed', error);
        const message = error.response?.data?.message || 'Failed to save warehouse';
        const errorText = Array.isArray(message) ? message[0] : message;
        setApiError(errorText);
        toast.error(errorText);
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      formik.resetForm({ values: warehouse ? { ...warehouse } : defaultValues });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, warehouse]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{warehouse?._id ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
          <DialogDescription>Enter the details for the warehouse.</DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Warehouse ID *</label>
              <Input
                name="warehouse_id"
                value={formik.values.warehouse_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. WH001"
                disabled={!!warehouse?._id}
              />
              {formik.touched.warehouse_id && formik.errors.warehouse_id && (
                <div className="text-xs text-danger">{formik.errors.warehouse_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Name *</label>
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Main Warehouse"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-xs text-danger">{formik.errors.name as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Location</label>
              <Input
                name="location"
                value={formik.values.location || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Building A, Floor 2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { WarehouseModal };
