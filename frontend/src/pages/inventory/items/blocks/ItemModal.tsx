import { useEffect, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
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
  epc_prefix?: string | null;
  uhf_range_start?: number | null;
  uhf_range_end?: number | null;
}

type MatchMode = 'prefix' | 'range';

interface FormValues {
  item_id: string;
  item_name: string;
  mode: MatchMode;
  epc_prefix: string;
  uhf_range_start: string;
  uhf_range_end: string;
}

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSuccess: () => void;
}

const validationSchema = Yup.object().shape({
  item_id: Yup.string().trim().required('Item ID (SKU) is required'),
  item_name: Yup.string().trim().required('Item name is required'),
  mode: Yup.string().oneOf(['prefix', 'range']),
  epc_prefix: Yup.string().when('mode', {
    is: 'prefix',
    then: (s) =>
      s
        .trim()
        .required('EPC prefix is required')
        .matches(/^[0-9A-Fa-f]+$/, 'Use hexadecimal characters only (0-9, A-F), e.g. E280'),
    otherwise: (s) => s.optional()
  }),
  uhf_range_start: Yup.string().when('mode', {
    is: 'range',
    then: (s) => s.required('Start is required').matches(/^\d+$/, 'Whole numbers only'),
    otherwise: (s) => s.optional()
  }),
  uhf_range_end: Yup.string().when('mode', {
    is: 'range',
    then: (s) =>
      s
        .required('End is required')
        .matches(/^\d+$/, 'Whole numbers only')
        .test('gte', 'End must be ≥ start', function (value) {
          const start = Number(this.parent.uhf_range_start);
          return value === undefined || Number.isNaN(start) || Number(value) >= start;
        }),
    otherwise: (s) => s.optional()
  })
});

const toFormValues = (item: Item | null): FormValues => ({
  item_id: item?.item_id ?? '',
  item_name: item?.item_name ?? '',
  mode: item && !item.epc_prefix && item.uhf_range_start != null ? 'range' : 'prefix',
  epc_prefix: item?.epc_prefix ?? '',
  uhf_range_start: item?.uhf_range_start != null ? String(item.uhf_range_start) : '',
  uhf_range_end: item?.uhf_range_end != null ? String(item.uhf_range_end) : ''
});

const ItemModal = ({ open, onOpenChange, item, onSuccess }: ItemModalProps) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik<FormValues>({
    initialValues: toFormValues(item),
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      const matching =
        values.mode === 'prefix'
          ? { epc_prefix: values.epc_prefix.trim().toUpperCase() }
          : {
              uhf_range_start: Number(values.uhf_range_start),
              uhf_range_end: Number(values.uhf_range_end)
            };
      try {
        if (item?._id) {
          await axios.patch(`${import.meta.env.VITE_APP_API_URL}/stock/items/${item._id}`, {
            item_name: values.item_name.trim(),
            ...matching
          });
          toast.success('Item updated successfully');
        } else {
          await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/items`, {
            item_id: values.item_id.trim(),
            item_name: values.item_name.trim(),
            ...matching
          });
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
      formik.resetForm({ values: toFormValues(item) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const fieldError = (name: keyof FormValues) =>
    formik.touched[name] && formik.errors[name] ? (
      <div className="text-xs text-danger">{formik.errors[name] as string}</div>
    ) : null;

  const setMode = (mode: MatchMode) => {
    formik.setFieldValue('mode', mode);
    setApiError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
          <DialogTitle>{item?._id ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription>Define the item and how its RFID tags are recognised.</DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="flex flex-col">
          {apiError && (
            <div className="px-5 pt-5">
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}

          <div className="flex flex-col gap-5 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {fieldError('item_id')}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-900">Item Name *</label>
                <Input
                  name="item_name"
                  value={formik.values.item_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Mouse"
                />
                {fieldError('item_name')}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900">How are this item's tags identified? *</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'prefix', title: 'EPC prefix', hint: 'Tags starting with e.g. E280' },
                    { value: 'range', title: 'Tag number range', hint: 'Tags numbered e.g. 1 to 199' }
                  ] as const
                ).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setMode(o.value)}
                    className={clsx(
                      'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-start transition-colors',
                      formik.values.mode === o.value
                        ? 'border-primary bg-primary-light'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    aria-pressed={formik.values.mode === o.value}
                  >
                    <span className={clsx('text-2sm font-semibold', formik.values.mode === o.value ? 'text-primary' : 'text-gray-900')}>
                      {o.title}
                    </span>
                    <span className="text-xs text-gray-500">{o.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {formik.values.mode === 'prefix' ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-900">EPC Prefix *</label>
                <Input
                  name="epc_prefix"
                  value={formik.values.epc_prefix}
                  onChange={(e) => formik.setFieldValue('epc_prefix', e.target.value.toUpperCase())}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. E280"
                  className="font-mono"
                />
                {fieldError('epc_prefix') ?? (
                  <div className="text-xs text-gray-500">
                    Hexadecimal (0-9, A-F). Every tag whose EPC starts with this prefix is counted as this item.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-900">Tag Number Range *</label>
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 grow">
                    <Input
                      name="uhf_range_start"
                      inputMode="numeric"
                      value={formik.values.uhf_range_start}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="From, e.g. 001"
                    />
                    {fieldError('uhf_range_start')}
                  </div>
                  <span className="pt-2.5 text-sm text-gray-500">to</span>
                  <div className="flex flex-col gap-1 grow">
                    <Input
                      name="uhf_range_end"
                      inputMode="numeric"
                      value={formik.values.uhf_range_end}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="To, e.g. 199"
                    />
                    {fieldError('uhf_range_end')}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Tags whose number falls in this range (inclusive) are counted as this item. Ranges can't overlap
                  another item.
                </div>
              </div>
            )}
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

export { ItemModal };
