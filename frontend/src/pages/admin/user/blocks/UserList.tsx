import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components/keenicons';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { UserModal } from './UserModal';

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone: string;
}

interface UserListProps {
  refreshTrigger: number;
}

const UserList = ({ refreshTrigger }: UserListProps) => {
  const { companyId } = useParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/company/${companyId}/user`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [companyId, refreshTrigger]);

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/company/${companyId}/user/${userToDelete._id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete user');
    }
  };

  const renderRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      SuperAdmin: 'badge-danger',
      Admin: 'badge-primary',
      Worker: 'badge-success',
      Customer: 'badge-info'
    };
    return <span className={`badge ${variants[role] || 'badge-light'}`}>{role}</span>;
  };

  if (loading) {
    return <div className="flex justify-center p-10">Loading users...</div>;
  }

  return (
    <div className="card mt-5">
      <div className="card-header">
        <h3 className="card-title">Active Users</h3>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-auto table-border align-middle text-gray-700 font-medium">
            <thead>
              <tr>
                <th className="min-w-[150px]">Name</th>
                <th className="min-w-[200px]">Email</th>
                <th className="min-w-[100px]">Role</th>
                <th className="min-w-[120px]">Phone</th>
                <th className="w-[100px] text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold">{user.first_name} {user.last_name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{renderRoleBadge(user.role)}</td>
                    <td>{user.phone || '-'}</td>
                    <td className="text-end">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear"
                          onClick={() => {
                            setUserToEdit(user);
                            setEditModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear text-danger"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    No users found for this company.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.first_name}? This action cannot be undone.`}
      />

      <UserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={userToEdit}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export { UserList };
