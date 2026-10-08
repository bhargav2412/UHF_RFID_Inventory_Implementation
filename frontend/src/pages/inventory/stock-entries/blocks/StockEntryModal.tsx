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
import { Machine } from '../../machines/blocks/MachineModal';

interface StockEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any | null;
  onSuccess: () => void;
}

const validationSchema = Yup.object().shape({
  stock_entry_id: Yup.string().required('Stock Entry ID is required'),
  epc_id: Yup.string().required('EPC ID is required'),
  reader_id: Yup.string().required('Machine is required'),
  type: Yup.string().oneOf(['inbound', 'outbound']).required('Type is required'),
  tag_id: Yup.string().optional()
});

const defaultValues = {
  stock_entry_id: '',
  epc_id: '',
  tag_id: '',
  reader_id: '',
  type: 'inbound' as 'inbound' | 'outbound'
};

const StockEntryModal = ({ open, onOpenChange, entry, onSuccess }: StockEntryModalProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    if (open) {
      axios
        .get(`${import.meta.env.VITE_APP_API_URL}/stock/machines`, { params: { limit: 200, status: 'active' } })
        .then((res) => setMachines(res.data.data || []))
        .catch(() => toast.error('Failed to load machines'));
    }
  }, [open]);

  const formik = useFormik({
    initialValues: entry ? { ...entry } : defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        if (entry?._id) {
          await axios.patch(`${import.meta.env.VITE_APP_API_URL}/stock/ledger/${entry._id}`, values);
          toast.success('Stock entry updated successfully');
        } else {
          await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/push`, [values]);
          toast.success('Stock entry pushed successfully');
        }
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save failed', error);
        const message = error.response?.data?.message || 'Failed to save stock entry';
        const errorText = Array.isArray(message) ? message[0] : message;
        setApiError(errorText);
        toast.error(errorText);
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleMachineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const readerId = e.target.value;
    formik.setFieldValue('reader_id', readerId);
    const machine = machines.find((m) => m.reader_id === readerId);
    if (machine && !entry?._id) {
      formik.setFieldValue('type', machine.type);
    }
  };

  useEffect(() => {
    if (open) {
      setApiError(null);
      formik.resetForm({
        values: entry
          ? { ...entry }
          : { ...defaultValues, stock_entry_id: `ENTRY-${Date.now()}` }
      });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, entry]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{entry?._id ? 'Edit Stock Entry' : 'Push Stock Entry'}</DialogTitle>
          <DialogDescription>
            {entry?._id ? 'Update the details for this transaction.' : 'Manually record a stock movement.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Stock Entry ID *</label>
              <Input
                name="stock_entry_id"
                value={formik.values.stock_entry_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Unique ID"
                disabled={!!entry?._id}
              />
              {formik.touched.stock_entry_id && formik.errors.stock_entry_id && (
                <div className="text-xs text-danger">{formik.errors.stock_entry_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">EPC ID *</label>
              <Input
                name="epc_id"
                value={formik.values.epc_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="RFID EPC ID"
              />
              {formik.touched.epc_id && formik.errors.epc_id && (
                <div className="text-xs text-danger">{formik.errors.epc_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Tag ID</label>
              <Input
                name="tag_id"
                value={formik.values.tag_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Tag ID (Optional)"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Machine *</label>
              <select
                name="reader_id"
                className="select select-sm"
                value={formik.values.reader_id}
                onChange={handleMachineChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select machine...</option>
                {machines.map((m) => (
                  <option key={m._id} value={m.reader_id}>
                    {m.name} ({m.reader_id}) — {m.type}
                  </option>
                ))}
              </select>
              {formik.touched.reader_id && formik.errors.reader_id && (
                <div className="text-xs text-danger">{formik.errors.reader_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Type *</label>
              <select
                name="type"
                className="select select-sm"
                value={formik.values.type}
                onChange={formik.handleChange}
              >
                <option value="inbound">Inbound (Stock In)</option>
                <option value="outbound">Outbound (Stock Out)</option>
              </select>
              <span className="text-xs text-gray-500">Defaults from machine; can be overridden per entry.</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
            <button type="button" className="btn btn-light" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Saving...' : entry?._id ? 'Save Changes' : 'Push Entry'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { StockEntryModal };
