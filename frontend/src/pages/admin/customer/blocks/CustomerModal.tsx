import React, { useState, useEffect } from 'react';
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
import { KeenIcon } from '@/components/keenicons';

interface Customer {
  _id?: string;
  name: string;
  short_code: string;
  email: string;
  phone: string;
  gst_number: string;
  pan_number: string;
  aadhar_number: string;
  company_address: string;
  city: string;
  state: string;
  country: string;
}

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Customer) => Promise<void>;
  customer: Customer | null;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  phone: Yup.string().required('Phone is required').min(10, 'Phone must be 10 digits').max(10, 'Phone must be 10 digits'),
  email: Yup.string().email('Invalid email format').nullable(),
  short_code: Yup.string().required('Short code is required').max(10, 'Max 10 characters'),
  gst_number: Yup.string().min(15, 'GST must be 15 characters').nullable(),
  company_address: Yup.string().min(3, 'Address must be at least 3 characters').nullable()
});

const defaultValues: Customer = {
  name: '',
  short_code: '',
  email: '',
  phone: '',
  gst_number: '',
  pan_number: '',
  aadhar_number: '',
  company_address: '',
  city: '',
  state: '',
  country: 'India'
};

const CustomerModal = ({ open, onOpenChange, onSave, customer }: CustomerModalProps) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: customer || defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        // Remove empty strings, null, or undefined fields from the payload
        const cleanedValues = Object.fromEntries(
          Object.entries(values).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        ) as Customer;

        await onSave(cleanedValues);
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save failed', error);
        const message = error.response?.data?.message || 'Failed to save customer';
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
      formik.resetForm({ values: customer || defaultValues });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, customer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{customer?._id ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogDescription>Fill in the customer details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger" icon="information-2">
                {apiError}
              </Alert>
            </div>
          )}
          <div className="grid grid-cols-2 gap-5 p-5 scrollable-y-auto" style={{ maxHeight: '70vh' }}>
            {/* Basic Info Section */}
            <div className="col-span-2 text-md font-semibold text-gray-900 border-b pb-1">Basic Information</div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Name *</label>
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Full Name"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-xs text-danger">{formik.errors.name}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Short Code *</label>
              <Input
                name="short_code"
                value={formik.values.short_code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Unique Code (e.g. CUST01)"
              />
              {formik.touched.short_code && formik.errors.short_code && (
                <div className="text-xs text-danger">{formik.errors.short_code}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Phone *</label>
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Primary phone"
              />
              {formik.touched.phone && formik.errors.phone && (
                <div className="text-xs text-danger">{formik.errors.phone}</div>
              )}
            </div>


            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Email</label>
              <Input
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                placeholder="Email address"
              />
            </div>

            {/* Tax & Business Section */}
            <div className="col-span-2 text-md font-semibold text-gray-900 border-b pb-1 mt-2">Tax & Business Info</div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">GST Number</label>
              <Input
                name="gst_number"
                value={formik.values.gst_number}
                onChange={formik.handleChange}
                placeholder="GSTIN"
              />
              {formik.touched.gst_number && formik.errors.gst_number && (
                <div className="text-xs text-danger">{formik.errors.gst_number}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">PAN Number</label>
              <Input
                name="pan_number"
                value={formik.values.pan_number}
                onChange={formik.handleChange}
                placeholder="Permanent Account Number"
              />
            </div>



            {/* Address Section */}
            <div className="col-span-2 text-md font-semibold text-gray-900 border-b pb-1 mt-2">Address</div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Company Address</label>
              <textarea
                name="company_address"
                className="input h-auto py-3"
                rows={2}
                value={formik.values.company_address}
                onChange={formik.handleChange}
                placeholder="Full address"
              ></textarea>
              {formik.touched.company_address && formik.errors.company_address && (
                <div className="text-xs text-danger">{formik.errors.company_address}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">City</label>
              <Input
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
                placeholder="City"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">State</label>
              <Input
                name="state"
                value={formik.values.state}
                onChange={formik.handleChange}
                placeholder="State"
              />
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

export { CustomerModal, type Customer };
