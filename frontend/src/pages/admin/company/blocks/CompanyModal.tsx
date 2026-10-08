import React, { useEffect } from 'react';
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

interface Company {
  _id?: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  gst_number: string;
  status: string;
  status_app: string;
  description: string;
}

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (company: Company) => Promise<void>;
  company: Company | null;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  city: Yup.string().required('City is required'),
  address: Yup.string().required('Address is required'),
  phone: Yup.string().required('Phone is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  gst_number: Yup.string(),
  status: Yup.string(),
  status_app: Yup.string(),
  description: Yup.string()
});

const defaultValues: Company = {
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  gst_number: '',
  status: 'Active',
  status_app: 'Active',
  description: ''
};

const CompanyModal = ({ open, onOpenChange, onSave, company }: CompanyModalProps) => {
  const formik = useFormik({
    initialValues: company || defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Remove empty strings, null, or undefined fields from the payload
        const cleanedValues = Object.fromEntries(
          Object.entries(values).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        ) as Company;

        await onSave(cleanedValues);
        onOpenChange(false);
      } catch (error) {
        console.error('Save failed', error);
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Explicitly reset form when modal opens/closes or company changes
  useEffect(() => {
    if (open) {
      formik.resetForm({ values: company || defaultValues });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, company]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader className="py-4 px-5 border-b border-gray-200">
          <DialogTitle>{company?._id ? 'Edit Company' : 'Add Company'}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          <div className="grid gap-5 p-5 scrollable-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Name *</label>
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter company name"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-xs text-danger">{formik.errors.name}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Email *</label>
              <Input
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter email"
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-xs text-danger">{formik.errors.email}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-900">Phone *</label>
                <Input
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter phone number"
                />
                {formik.touched.phone && formik.errors.phone && (
                  <div className="text-xs text-danger">{formik.errors.phone}</div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-900">GST Number</label>
                <Input
                  name="gst_number"
                  value={formik.values.gst_number}
                  onChange={formik.handleChange}
                  placeholder="Enter GST number"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">City *</label>
              <Input
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter city"
              />
              {formik.touched.city && formik.errors.city && (
                <div className="text-xs text-danger">{formik.errors.city}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Address *</label>
              <textarea
                name="address"
                className="input h-auto py-3"
                rows={3}
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter full address"
              ></textarea>
              {formik.touched.address && formik.errors.address && (
                <div className="text-xs text-danger">{formik.errors.address}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Description</label>
              <textarea
                name="description"
                className="input h-auto py-3"
                rows={2}
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Enter description"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-2">
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Status</span>
                  <span className="text-2sm text-gray-700">Company status</span>
                </div>
                <label className="switch switch-sm">
                  <input
                    type="checkbox"
                    checked={formik.values.status === 'Active'}
                    onChange={(e) =>
                      formik.setFieldValue('status', e.target.checked ? 'Active' : 'Inactive')
                    }
                  />
                  <span className="switch-label">Active</span>
                </label>

              </div>

              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">App Status</span>
                  <span className="text-2sm text-gray-700">Mobile app access</span>
                </div>
                <label className="switch switch-sm">
                  <input
                    type="checkbox"
                    checked={formik.values.status_app === 'Active'}
                    onChange={(e) =>
                      formik.setFieldValue('status_app', e.target.checked ? 'Active' : 'Inactive')
                    }
                  />
                  <span className="switch-label">Active</span>
                </label>

              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => onOpenChange(false)}
              disabled={formik.isSubmitting}
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

export { CompanyModal, type Company };
