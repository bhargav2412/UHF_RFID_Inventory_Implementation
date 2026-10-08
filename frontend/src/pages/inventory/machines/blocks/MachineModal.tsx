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
import { Warehouse } from '../../warehouses/blocks/WarehouseModal';

export interface Machine {
  _id?: string;
  machine_id: string;
  reader_id: string;
  name: string;
  warehouse_id: string | { _id: string; warehouse_id: string; name: string };
  type: 'inbound' | 'outbound';
  status: 'active' | 'inactive';
}

interface MachineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onSuccess: () => void;
}

const validationSchema = Yup.object().shape({
  machine_id: Yup.string().required('Machine ID is required'),
  reader_id: Yup.string().required('Reader ID is required'),
  name: Yup.string().required('Name is required'),
  warehouse_id: Yup.string().required('Warehouse is required'),
  type: Yup.string().oneOf(['inbound', 'outbound']).required('Type is required'),
  status: Yup.string().oneOf(['active', 'inactive']).required('Status is required')
});

const defaultValues = {
  machine_id: '',
  reader_id: '',
  name: '',
  warehouse_id: '',
  type: 'inbound' as 'inbound' | 'outbound',
  status: 'active' as 'active' | 'inactive'
};

const getWarehouseId = (machine: Machine | null): string => {
  if (!machine?.warehouse_id) return '';
  if (typeof machine.warehouse_id === 'string') return machine.warehouse_id;
  return machine.warehouse_id._id;
};

const MachineModal = ({ open, onOpenChange, machine, onSuccess }: MachineModalProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    if (open) {
      axios
        .get(`${import.meta.env.VITE_APP_API_URL}/stock/warehouses`, { params: { limit: 200 } })
        .then((res) => setWarehouses(res.data.data || []))
        .catch(() => toast.error('Failed to load warehouses'));
    }
  }, [open]);

  const formik = useFormik({
    initialValues: machine
      ? {
          machine_id: machine.machine_id,
          reader_id: machine.reader_id,
          name: machine.name,
          warehouse_id: getWarehouseId(machine),
          type: machine.type,
          status: machine.status || 'active'
        }
      : defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        if (machine?._id) {
          await axios.patch(`${import.meta.env.VITE_APP_API_URL}/stock/machines/${machine._id}`, values);
          toast.success('Machine updated successfully');
        } else {
          await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/machines`, values);
          toast.success('Machine created successfully');
        }
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save failed', error);
        const message = error.response?.data?.message || 'Failed to save machine';
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
      formik.resetForm({
        values: machine
          ? {
              machine_id: machine.machine_id,
              reader_id: machine.reader_id,
              name: machine.name,
              warehouse_id: getWarehouseId(machine),
              type: machine.type,
              status: machine.status || 'active'
            }
          : defaultValues
      });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, machine]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{machine?._id ? 'Edit Machine' : 'Add Machine'}</DialogTitle>
          <DialogDescription>Configure an RFID reading machine linked to a warehouse.</DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Machine ID *</label>
              <Input
                name="machine_id"
                value={formik.values.machine_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. MACH001"
                disabled={!!machine?._id}
              />
              {formik.touched.machine_id && formik.errors.machine_id && (
                <div className="text-xs text-danger">{formik.errors.machine_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Reader ID *</label>
              <Input
                name="reader_id"
                value={formik.values.reader_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. READER001"
              />
              {formik.touched.reader_id && formik.errors.reader_id && (
                <div className="text-xs text-danger">{formik.errors.reader_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Name *</label>
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Gate Reader A"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-xs text-danger">{formik.errors.name as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Warehouse *</label>
              <select
                name="warehouse_id"
                className="select select-sm"
                value={formik.values.warehouse_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.warehouse_id} — {w.name}
                  </option>
                ))}
              </select>
              {formik.touched.warehouse_id && formik.errors.warehouse_id && (
                <div className="text-xs text-danger">{formik.errors.warehouse_id as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Default Type *</label>
              <select
                name="type"
                className="select select-sm"
                value={formik.values.type}
                onChange={formik.handleChange}
              >
                <option value="inbound">Inbound (Stock In)</option>
                <option value="outbound">Outbound (Stock Out)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Status *</label>
              <select
                name="status"
                className="select select-sm"
                value={formik.values.status}
                onChange={formik.handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
            <button type="button" className="btn btn-light" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { MachineModal };
