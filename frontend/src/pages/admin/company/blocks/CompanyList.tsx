import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import {
  DataGrid,
  DataGridColumnHeader,
  KeenIcon,
  Menu,
  MenuItem,
  MenuToggle
} from '@/components';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n';
import { CompanyModal, type Company } from '@/pages/admin/company/blocks/CompanyModal';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';

const API_URL = import.meta.env.VITE_APP_API_URL + '/company';

const CompanyList = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching companies', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = () => {
    setSelectedCompany(null);
    setModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setModalOpen(true);
  };

  const handleView = (id: string) => {
    navigate(`/admin/company/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setCompanyToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;
    try {
      await axios.delete(`${API_URL}/${companyToDelete}`);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Failed to delete company');
    }
  };

  const handleSave = async (company: Company) => {
    try {
      if (company._id) {
        await axios.patch(`${API_URL}/${company._id}`, company);
        toast.success('Company updated successfully');
      } else {
        await axios.post(API_URL, company);
        toast.success('Company created successfully');
      }
      fetchCompanies();
    } catch (err) {
      console.error("Save error", err);
      toast.error("Failed to save company");
      throw err;
    }
  };

  const columns = useMemo<ColumnDef<Company>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Company Name" column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div
            className="flex flex-col cursor-pointer hover:text-primary transition-colors"
            onClick={() => handleView(info.row.original._id!)}
          >
            <span className="font-semibold text-gray-900">{info.getValue() as string}</span>
            <span className="text-2sm text-gray-700">{info.row.original.city}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[200px]'
        }
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataGridColumnHeader title="Email" column={column} />,
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: {
          headerClassName: 'min-w-[200px]'
        }
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: true,
        cell: (info) => {
          const status = info.getValue() as string;
          const variant = status === 'Active' ? 'badge-success' : 'badge-danger';
          return (
            <span className={`badge badge-sm badge-outline ${variant}`}>
              {status}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[100px]'
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
        meta: { headerClassName: 'w-[60px]' }
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
        (c.city && c.city.toLowerCase().includes(lower)) ||
        (c.email && c.email.toLowerCase().includes(lower))
    );
  }, [data, searchTerm]);

  const Toolbar = () => (
    <div className="card-header flex-wrap px-5 py-5 border-b-0 gap-2">
      <h3 className="card-title">Companies</h3>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <KeenIcon
            icon="magnifier"
            className="leading-none text-md text-gray-500 absolute top-1/2 start-0 -translate-y-1/2 ms-3"
          />
          <Input
            type="text"
            className="input-sm ps-8 w-48"
            placeholder="Search Companies"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex border border-gray-200 rounded-md overflow-hidden">
          <button
            className={`btn btn-xs btn-icon ${viewMode === 'table' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setViewMode('table')}
          >
            <KeenIcon icon="row-horizontal" />
          </button>
          <button
            className={`btn btn-xs btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setViewMode('grid')}
          >
            <KeenIcon icon="element-plus" />
          </button>
        </div>

        <button className="btn btn-sm btn-primary" onClick={handleCreate}>
          <KeenIcon icon="plus-square" className="me-1" /> Add Company
        </button>
      </div>
    </div>
  );

  return (
    <>
      {viewMode === 'table' ? (
        <DataGrid
          columns={columns}
          data={filteredData}
          rowSelection={true}
          pagination={{ size: 10 }}
          sorting={[{ id: 'name', desc: false }]}
          toolbar={<Toolbar />}
          layout={{ card: true }}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="card border-0 shadow-none bg-transparent">
            <Toolbar />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredData.map((company) => (
              <div key={company._id} className="card p-5 group hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => handleView(company._id!)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center text-lg">
                      {(company.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-md">{company.name || 'Unnamed Company'}</span>
                      <span className="text-2sm text-gray-600">{company.city || 'No City'}</span>
                    </div>

                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-xs btn-icon btn-light btn-clear hover:text-primary"
                      onClick={() => handleEdit(company)}
                      title="Edit"
                    >
                      <KeenIcon icon="pencil" />
                    </button>
                    <button
                      className="btn btn-xs btn-icon btn-light btn-clear hover:text-danger"
                      onClick={() => handleDeleteClick(company._id!)}
                      title="Delete"
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-2sm text-gray-700">
                    <KeenIcon icon="sms" className="text-gray-500 text-sm" />
                    <span className="truncate">{company.email || 'No Email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-2sm text-gray-700">
                    <KeenIcon icon="phone" className="text-gray-500 text-sm" />
                    <span>{company.phone || 'No Phone'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-2">
                  <span className={`badge badge-xs badge-outline ${company.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {company.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xs text-gray-500 uppercase font-bold">App</span>
                    <div className={`h-2 w-2 rounded-full ${company.status_app === 'Active' ? 'bg-success' : 'bg-danger'}`}></div>
                  </div>
                </div>
              </div>
            ))}
            {filteredData.length === 0 && !loading && (
              <div className="col-span-full card p-10 text-center text-gray-500 border-dashed border-2">
                No companies found. Add your first company!
              </div>
            )}
          </div>
        </div>
      )}
      <CompanyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        company={selectedCompany}
      />
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Company"
        description="Are you sure you want to delete this company? All associated data will be archived."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export { CompanyList };
