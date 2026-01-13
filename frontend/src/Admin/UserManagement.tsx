import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // You need to install this library: npm install jwt-decode

// Define the User type based on your Mongoose schema
type User = {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'educator' | 'admin' | 'parent' | 'school' | 'guest' | 'superadmin';
  isApproved?: boolean;
  approvedBy?: string | null;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
  };
  profilePic?: string;
};

// Define the JWT payload type
type JwtPayload = {
  id: string;
  role: string;
  isApproved: boolean;
  exp: number;
};

// Base API URL - replace with your actual API endpoint
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Reusable Icon Component for UI elements
const Icon = ({ path, className = 'w-5 h-5' }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

// Icons paths for easy reference
const ICONS = {
  edit: "M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z",
  delete: "M18 6a3 3 0 00-3-3H9a3 3 0 00-3 3v12a3 3 0 003 3h6a3 3 0 003-3V6zM9 6h6v12H9V6z",
  approve: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  add: "M12 4.5v15m7.5-7.5h-15",
  close: "M6 18L18 6M6 6l12 12",
};

// --- Main User Management Component ---

const UserManagement = () => {
  // --- State Management ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUserRole] = useState<string | null>(null); // State for the current user's role

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // State for the Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'parent',
  });

  // --- Authorization and Data Fetching ---
  useEffect(() => {
    // Check user role from JWT token
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const role = decodedToken.role;
      setUserRole(role);

      // Check for superadmin authorization
      if (role !== 'superadmin') {
        setError("You are not authorized to view this page. Access is restricted to Super Admins.");
        setLoading(false);
        return;
      }

    } catch (err) {
      setError("Invalid token. Please log in again.");
      setLoading(false);
      return;
    }

    // If the user is a superadmin, proceed with fetching data
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sortedUsers = response.data.sort((a: User, b: User) => {
          const aIsPendingAdmin = a.role === 'admin' && !a.isApproved;
          const bIsPendingAdmin = b.role === 'admin' && !b.isApproved;
          if (aIsPendingAdmin && !bIsPendingAdmin) return -1;
          if (!aIsPendingAdmin && bIsPendingAdmin) return 1;
          return 0;
        });
        
        setUsers(sortedUsers);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError(err.response?.data?.error || err.message || 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // The empty dependency array ensures this runs only once on component mount

  // --- Memoized Filtering and Searching ---
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (roleFilter === 'all') return true;
        if (roleFilter === 'pending_admin') return user.role === 'admin' && !user.isApproved;
        return user.role === roleFilter;
      })
      .filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm, roleFilter]);

  // --- CRUD Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    const url = editingUser ? `${API_BASE}/users/${editingUser._id}` : `${API_BASE}/users`;
    const method = editingUser ? 'put' : 'post';

    const payload = { ...formData };
    if (editingUser && !payload.password) {
        delete (payload as any).password;
    }

    try {
      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (editingUser) {
        setUsers(users.map(u => (u._id === editingUser._id ? response.data : u)));
      } else {
        setUsers([response.data, ...users]);
      }
      closeModal();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      alert(`Error: ${err.response?.data?.error || 'Could not save user.'}`);
    }
  };

  const handleApproveAdmin = async (userId: string) => {
    if (!window.confirm('Are you sure you want to approve this admin?')) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(`${API_BASE}/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.map(u => (u._id === userId ? response.data : u)));
    } catch (err: any) {
      console.error('Failed to approve admin:', err);
      alert(`Error: ${err.response?.data?.error || 'Could not approve admin.'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter(u => u._id !== userId));
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      alert(`Error: ${err.response?.data?.error || 'Could not delete user.'}`);
    }
  };

  // --- Modal Control ---
  const openModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'parent' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // --- Render Logic ---
  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100"><div className="text-xl font-semibold">Loading Users...</div></div>;
  }

  // Check for authorization error
  if (error) {
    return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 p-8">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users across the platform.</p>
        </div>

        {/* Control Bar: Search, Filter, Add */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="relative w-full sm:w-auto sm:flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon path={ICONS.search} className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="all">All Roles</option>
              <option value="pending_admin">Pending Admins</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="parent">Parent</option>
              <option value="school">School</option>
              <option value="educator">Educator</option>
              <option value="student">Student</option>
            </select>
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              <Icon path={ICONS.add} className="w-5 h-5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover" src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=random`} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'admin' ? (
                            user.isApproved ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>
                            ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Pending Approval</span>
                            )
                        ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>{user.subscription.status}</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        {user.role === 'admin' && !user.isApproved && (
                          <button onClick={() => handleApproveAdmin(user._id)} className="text-green-600 hover:text-green-900" title="Approve Admin">
                            <Icon path={ICONS.approve} />
                          </button>
                        )}
                        <button onClick={() => openModal(user)} className="text-indigo-600 hover:text-indigo-900" title="Edit User">
                          <Icon path={ICONS.edit} />
                        </button>
                        {user.role !== 'superadmin' && (
                          <button onClick={() => handleDeleteUser(user._id)} className="text-red-600 hover:text-red-900" title="Delete User">
                            <Icon path={ICONS.delete} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon path={ICONS.close} className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} placeholder={editingUser ? "Leave blank to keep current password" : ""} required={!editingUser} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" id="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="admin">Admin</option>
                  <option value="parent">Parent</option>
                  <option value="school">School</option>
                  <option value="educator">Educator</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={closeModal} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Cancel
                </button>
                <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;