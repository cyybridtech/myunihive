import { useState, useEffect } from 'react';
import { Search, Check, RefreshCw } from 'lucide-react';
import { getAdminUsers, updateAdminUser } from '../api/api.js';

export default function AdminUsersTab() {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res: any = await getAdminUsers();
      if (res && res.status === 'success') {
        setAdminUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (targetUserId: number, newRole: string) => {
    try {
      const res: any = await updateAdminUser({ target_user_id: targetUserId, role: newRole });
      if (res && res.status === 'success') {
        setAdminUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      }
    } catch (err: any) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleToggleVerification = async (targetUserId: number, currentVerified: boolean | number) => {
    const nextVerified = currentVerified ? 0 : 1;
    const nextStatus = nextVerified ? 'verified' : 'unverified';
    try {
      const res: any = await updateAdminUser({
        target_user_id: targetUserId,
        verified: nextVerified,
        verification_status: nextStatus
      });
      if (res && res.status === 'success') {
        setAdminUsers(prev =>
          prev.map(u => u.id === targetUserId ? { ...u, verified: nextVerified, verification_status: nextStatus } : u)
        );
      }
    } catch (err: any) {
      alert('Failed to update verification: ' + err.message);
    }
  };

  const filteredUsers = adminUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term);

    const matchesRole =
      roleFilter === 'all' ||
      u.role === roleFilter ||
      (roleFilter === 'manager' && (u.role === 'manager' || u.role === 'hostel_manager'));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && Boolean(u.verified)) ||
      (statusFilter === 'unverified' && !u.verified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Accounts</h2>
          <p className="text-sm text-gray-500">
            Manage student accounts, manager permissions, and account statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Directory
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="hostel_manager">Hostel Managers</option>
            <option value="manager">Managers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified Accounts</option>
            <option value="unverified">Unverified Accounts</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading && adminUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No users found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">University</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (u.full_name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{u.full_name}</p>
                          <p className="text-[11px] text-gray-500">{u.email}</p>
                          {u.phone && <p className="text-[10px] text-gray-400 font-mono">{u.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* University */}
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {u.university_name || 'General / None'}
                    </td>

                    {/* Role Selector */}
                    <td className="px-5 py-4">
                      <select
                        value={u.role || 'student'}
                        onChange={e => handleUpdateRole(u.id, e.target.value)}
                        className="text-xs font-bold py-1 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="hostel_manager">Hostel Manager</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Verification Status */}
                    <td className="px-5 py-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          <Check className="w-3 h-3 stroke-[3]" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleVerification(u.id, u.verified)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                          u.verified
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {u.verified ? 'Revoke Status' : 'Approve Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
