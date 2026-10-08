import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import {
  DataGrid,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridRowSelect,
  DataGridRowSelectAll,
  KeenIcon,
  Menu,
  MenuItem,
  MenuToggle
} from '@/components';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n';
import { CustomerModal, type Customer } from '@/pages/admin/customer/blocks/CustomerModal';
import { useParams } from 'react-router-dom';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';

const CustomerList = () => {
  const { isRTL } = useLanguage();
  const { companyId } = useParams<{ companyId: string }>();
  const API_URL = import.meta.env.VITE_APP_API_URL + `/company/${companyId}/customer`;
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customers', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`${API_URL}/${customerToDelete}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleSave = async (customer: Customer) => {
    if (customer._id) {
      await axios.patch(`${API_URL}/${customer._id}`, customer);
      toast.success('Customer updated successfully');
    } else {
      await axios.post(API_URL, customer);
      toast.success('Customer created successfully');
    }
    fetchCustomers();
  };

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: '_id',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: 'w-0'
        }
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Customer Name" column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{info.getValue() as string}</span>
            <span className="text-2sm text-gray-700">{info.row.original.short_code}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[200px]'
        }
      },
      {
        accessorKey: 'phone',
        header: ({ column }) => <DataGridColumnHeader title="Contact" column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-gray-800">{info.getValue() as string}</span>
            <span className="text-2sm text-gray-700">{info.row.original.email}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[150px]'
        }
      },
      {
        accessorKey: 'city',
        header: ({ column }) => <DataGridColumnHeader title="City/State" column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-gray-800">{info.getValue() as string}</span>
            <span className="text-2sm text-gray-700">{info.row.original.state}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[150px]'
        }
      },
      {
        id: 'actions',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="btn btn-sm btn-icon btn-light btn-clear hover:text-primary"
              onClick={() => handleEdit(row.original)}
              title="Edit"
            >
              <KeenIcon icon="pencil" />
            </button>
            <button
              className="btn btn-sm btn-icon btn-light btn-clear hover:text-danger"
              onClick={() => handleDeleteClick(row.original._id!)}
              title="Delete"
            >
              <KeenIcon icon="trash" />
            </button>
          </div>
        ),
        meta: {
          headerClassName: 'w-[60px]'
        }
      }
    ],
    [isRTL]
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        (c.short_code && c.short_code.toLowerCase().includes(lower)) ||
        (c.phone && c.phone.toLowerCase().includes(lower)) ||
        (c.email && c.email.toLowerCase().includes(lower))
    );
  }, [data, searchTerm]);

  const Toolbar = () => (
    <div className="card-header flex-wrap px-5 py-5 border-b-0 gap-2">
      <div className="card-title"></div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <KeenIcon
            icon="magnifier"
            className="leading-none text-md text-gray-500 absolute top-1/2 start-0 -translate-y-1/2 ms-3"
          />
          <Input
            type="text"
            className="input-sm ps-8 w-48"
            placeholder="Search Customers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-sm btn-primary" onClick={handleCreate}>
          <KeenIcon icon="plus-square" className="me-1" /> Create Customer
        </button>
      </div>
    </div>
  );

  return (
    <>
      <DataGrid
        columns={columns}
        data={filteredData}
        rowSelection={true}
        pagination={{ size: 10 }}
        sorting={[{ id: 'name', desc: false }]}
        toolbar={<Toolbar />}
        layout={{ card: true }}
      />
      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        customer={selectedCustomer}
      />
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export { CustomerList };
