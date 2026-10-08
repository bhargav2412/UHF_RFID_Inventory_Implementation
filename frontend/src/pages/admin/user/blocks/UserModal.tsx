import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

interface User {
  _id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
}

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

const validationSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string().min(10, 'Phone must be 10 digits').max(10, 'Phone must be 10 digits').nullable(),
  role: Yup.string().required('Role is required'),
  password: Yup.string().when('_id', {
    is: (id: string) => !id,
    then: (schema) => schema.required('Password is required').min(6, 'Min 6 characters'),
    otherwise: (schema) => schema.optional().nullable()
  })
});

const defaultValues: User = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'Worker',
  password: ''
};

const UserModal = ({ open, onOpenChange, user, onSuccess }: UserModalProps) => {
  const { companyId } = useParams();
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: user ? { ...user, password: '' } : defaultValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const payload = { ...values };
        if (user?._id) {
          delete payload.password; // Don't send password on update unless implemented
          await axios.patch(`${import.meta.env.VITE_APP_API_URL}/company/${companyId}/user/${user._id}`, payload);
          toast.success('User updated successfully');
        } else {
          await axios.post(`${import.meta.env.VITE_APP_API_URL}/company/${companyId}/user`, payload);
          toast.success('User created successfully');
        }
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save failed', error);
        const message = error.response?.data?.message || 'Failed to save user';
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
      formik.resetForm({ values: user ? { ...user, password: '' } : defaultValues });
    } else {
      formik.resetForm({ values: defaultValues });
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{user?._id ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription>Fill in the account details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}
          <div className="grid grid-cols-2 gap-5 p-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">First Name *</label>
              <Input
                name="first_name"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="First Name"
              />
              {formik.touched.first_name && formik.errors.first_name && (
                <div className="text-xs text-danger">{formik.errors.first_name as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Last Name *</label>
              <Input
                name="last_name"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Last Name"
              />
              {formik.touched.last_name && formik.errors.last_name && (
                <div className="text-xs text-danger">{formik.errors.last_name as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-gray-900">Email *</label>
              <Input
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="email@example.com"
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-xs text-danger">{formik.errors.email as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Phone</label>
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="10 digit number"
              />
              {formik.touched.phone && formik.errors.phone && (
                <div className="text-xs text-danger">{formik.errors.phone as string}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">Role *</label>
              <select
                name="role"
                className="select select-sm"
                value={formik.values.role}
                onChange={formik.handleChange}
              >
                <option value="Admin">Admin</option>
                <option value="Worker">Worker</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            {!user?._id && (
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-sm font-medium text-gray-900">Password *</label>
                <Input
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="At least 6 characters"
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="text-xs text-danger">{formik.errors.password as string}</div>
                )}
              </div>
            )}
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

export { UserModal };
