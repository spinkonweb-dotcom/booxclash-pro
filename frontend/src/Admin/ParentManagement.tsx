import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ChevronDown, ChevronUp } from 'lucide-react';

// --- Data Types ---
type Child = {
  _id: string;
  childName: string;
  progressStatus: 'active' | 'needs_upgrade' | 'premium';
};

type Parent = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'parent';
  createdAt: string;
  subscription: {
    plan: string;
    status: 'active' | 'inactive' | 'cancelled';
  };
  profilePic?: string;
  children: Child[];
  childCount: number;
  needsUpgrade: boolean; 
};

type JwtPayload = {
  id: string;
  role: string;
};

const API_BASE = "http://localhost:8080/api";

// --- Reusable UI Components ---
const Icon = ({ path, className = 'w-5 h-5' }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
  approve: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  delete: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
  phone: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.67c.622-.328 1.292-.622 2.006-.796a6.375 6.375 0 014.18-1.575l.001.109a12.318 12.318 0 01-6.374 1.766zM4.5 12a6 6 0 1012 0 6 6 0 00-12 0z",
  subscribed: "M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z",
  upgrade: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
};

const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string; }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className={`rounded-full p-3 ${color}`}>{icon}</div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// --- Main Parent Management Component ---
const ParentManagement = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) { 
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
    }
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.role !== 'superadmin') {
        setError("You are not authorized to view this page.");
        setLoading(false);
        return;
      }
    } catch (err) {
        setError("Invalid token. Please log in again.");
        setLoading(false);
        return;
    }

    const fetchParents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/parents`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const parentsWithData = response.data.map((parent: Parent) => ({
            ...parent,
            needsUpgrade: parent.children.some(child => child.progressStatus === 'needs_upgrade')
        }));
        
        setParents(parentsWithData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch parents:", err);
        setError(err.response?.data?.error || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchParents();
  }, []);

  const { filteredParents, stats } = useMemo(() => {
    const filtered = parents.filter(parent =>
        parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: parents.length,
        subscribed: parents.filter(p => p.children.some(c => c.progressStatus === 'premium')).length,
        needsUpgrade: parents.filter(p => p.needsUpgrade).length
    };
    
    return { filteredParents: filtered, stats };
  }, [parents, searchTerm]);

  const handleUpgradeChild = async (childId: string, parentId: string) => {
    if (!window.confirm('Are you sure you want to upgrade this child to premium?')) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.patch(`${API_BASE}/children/${childId}/upgrade`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedChild = response.data.child;

      setParents(prevParents => prevParents.map(parent => {
        if (parent._id === parentId) {
          const newChildren = parent.children.map(child => child._id === childId ? updatedChild : child);
          return {
            ...parent,
            children: newChildren,
            needsUpgrade: newChildren.some(c => c.progressStatus === 'needs_upgrade')
          };
        }
        return parent;
      }));

    } catch (err: any) {
      console.error('Failed to upgrade child:', err);
      alert(`Error: ${err.response?.data?.error || 'Could not upgrade child.'}`);
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this parent and all their children? This is irreversible.')) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE}/parents/${parentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParents(prevParents => prevParents.filter(p => p._id !== parentId));
    } catch (err: any) {
      console.error('Failed to delete parent:', err);
      alert(`Error: ${err.response?.data?.error || 'Could not delete parent.'}`);
    }
  };

  const toggleExpand = (parentId: string) => {
    setExpandedParentId(expandedParentId === parentId ? null : parentId);
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Parent Management</h1>
          <p className="text-gray-600 mt-1">Monitor subscriptions, upgrades, and parent activity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Parents" value={stats.total} icon={<Icon path={ICONS.users} className="w-6 h-6 text-blue-600"/>} color="bg-blue-100"/>
          <StatCard title="Parents with Subscriptions" value={stats.subscribed} icon={<Icon path={ICONS.subscribed} className="w-6 h-6 text-green-600"/>} color="bg-green-100"/>
          <StatCard title="Parents Needing Upgrade" value={stats.needsUpgrade} icon={<Icon path={ICONS.upgrade} className="w-6 h-6 text-orange-600"/>} color="bg-orange-100"/>
        </div>
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <input type="text" placeholder="Search by parent name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-md pl-4 pr-4 py-2 border rounded-md"/>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent & Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Children</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParents.map(parent => (
                <React.Fragment key={parent._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button onClick={() => toggleExpand(parent._id)} className="text-gray-500 hover:text-gray-800">
                        {expandedParentId === parent._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full object-cover" src={parent.profilePic || `https://ui-avatars.com/api/?name=${parent.name.replace(' ', '+')}&background=random`} alt={parent.name} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{parent.name}</div>
                          <div className="text-sm text-gray-500">{parent.email}</div>
                          {parent.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Icon path={ICONS.phone} className="w-4 h-4 mr-1.5" />
                                {parent.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{parent.childCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(parent.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleDeleteParent(parent._id)} className="text-red-600 hover:text-red-900" title="Delete Parent">
                        <Icon path={ICONS.delete} />
                      </button>
                    </td>
                  </tr>
                  {expandedParentId === parent._id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="p-0">
                        <div className="p-4">
                          <h4 className="font-semibold text-sm mb-2 text-gray-600">Children of {parent.name}:</h4>
                          <ul className="space-y-2">
                            {parent.children.map(child => (
                              <li key={child._id} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-gray-200">
                                <span className="font-medium text-sm text-gray-800">{child.childName}</span>
                                {child.progressStatus === 'premium' ? (
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Premium</span>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    {child.progressStatus === 'needs_upgrade' && (
                                      <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">Needs Upgrade</span>
                                    )}
                                    <button onClick={() => handleUpgradeChild(child._id, parent._id)} className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-md hover:bg-green-700">
                                      Upgrade Child
                                    </button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParentManagement;

