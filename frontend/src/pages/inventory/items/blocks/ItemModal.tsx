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

interface Item {
  _id?: string;
  item_id: string;
  item_name: string;
  epc_prefix: string;
}

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSuccess: () => void;
}

const validationSchema = Yup.object().shape({
  item_id: Yup.string().required('Item ID (SKU) is required'),
  item_name: Yup.string().required('Item name is required'),
  epc_prefix: Yup.string().required('EPC prefix is required')
});

const defaultValues: Item = {
  item_id: '',
  item_name: '',
  epc_prefix: ''
};

const ItemModal = ({ open, onOpenChange, item, onSuccess }: ItemModalProps) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: item ? { ...item } : defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        if (item?._id) {
          await axios.patch(`${import.meta.env.VITE_APP_API_URL}/stock/items/${item._id}`, values);
          toast.success('Item updated successfully');
        } else {
          await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/items`, values);
          toast.success('Item created successfully');
        }
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save failed', error);
        const message = error.response?.data?.message || 'Failed to save item';
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
      formik.resetForm({ values: item ? { ...item } : defaultValues });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{item?._id ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription>Enter the details for the inventory item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Item ID (SKU) *</label>
              <Input
                name="item_id"
                value={formik.values.item_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. ITEM001"
                disabled={!!item?._id}
              />
              {formik.touched.item_id && formik.errors.item_id && (
                <div className="text-xs text-danger">{formik.errors.item_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Item Name *</label>
              <Input
                name="item_name"
                value={formik.values.item_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Box Type A"
              />
              {formik.touched.item_name && formik.errors.item_name && (
                <div className="text-xs text-danger">{formik.errors.item_name as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">EPC Prefix *</label>
              <Input
                name="epc_prefix"
                value={formik.values.epc_prefix}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. E280"
              />
              {formik.touched.epc_prefix && formik.errors.epc_prefix && (
                <div className="text-xs text-danger">{formik.errors.epc_prefix as string}</div>
              )}
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

export { ItemModal };
