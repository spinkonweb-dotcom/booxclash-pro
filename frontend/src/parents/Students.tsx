import React, { useState } from 'react';
// Removed CheckCircle, AlertTriangle as they are no longer needed
import { Trash2, ArrowUpCircle, ShieldCheck, X, Info } from 'lucide-react';

// --- TYPES (from dashboardTypes.ts) ---

export interface Lesson {
  lessonId: string;
  title: string;
  type: 'lesson' | 'topic';
  completedAt: string; 
}

export interface ApiStudent {
  _id: string; 
  parentId: string; 
  childName: string;
  childGrade: string; 
  avatarUrl?: string;
  points: number;
  streak: number;
  isPremium: boolean;
  progressStatus: "active" | "needs_upgrade" | "premium"; 
  lessonsCompleted: Lesson[];
  createdAt: string; 
  updatedAt: string; 
  curriculum: string;
  subject: string;
}

// --- UTILITIES (from dashboardUtils.ts) ---

export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) {
    return 'sometime ago';
  }
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) {
    return "Just now";
  }

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

// --- API FUNCTIONS (from api.ts) ---

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token'); 
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  // This uses the /api/students route as per your route definition
  const response = await fetch(`${API_BASE}/api/students/${studentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to delete student');
  }
  return;
};

// --- REMOVED requestUpgradeNotification ---
// This component no longer calls this API.


// --- NEW UPGRADE NOTIFICATION MODAL ---
// This is now a simple, static info modal.

interface UpgradeNotificationModalProps {
  student: ApiStudent | null;
  onClose: () => void;
  // Removed 'onSubmit' prop as no API is called
}

const UpgradeNotificationModal: React.FC<UpgradeNotificationModalProps> = ({ student, onClose }) => {
  // Removed all useEffect, loading, and error states

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg relative transition-all transform scale-100 opacity-100">
        <button
          onClick={onClose} // Just close the modal
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        {/* Directly show the instructions */}
        <div>
          <div className="flex justify-center items-center flex-col text-center mb-6">
            <Info className="h-12 w-12 text-indigo-500" />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              Upgrade {student.childName}
            </h2>
            <p className="text-gray-500 mt-1">
              Great news! {student.childName} is ready to continue their learning adventure.
              Here are the instructions to upgrade.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center mb-3">
              <Info className="w-5 h-5 mr-2 text-indigo-600" />
              Mobile Money Payment Instructions
            </h3>
            {/* Hard-coded text as requested */}
            <ul className="space-y-2 text-gray-700">
              <li><strong>1. Amount:</strong> K95</li>
              <li><strong>2. Pay to Number:</strong> 0967001972 or 0978933791</li>
              <li><strong>3. Account Name:</strong> Booxclash Learn LTD</li>
              <li className="font-semibold text-red-600">
                <strong>4. IMPORTANT:</strong> After paying, please forward the confirmation message to the same number you paid to.
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              We will activate the account as soon as we confirm the payment.
            </p>
          </div>
          
           <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose} // Just close the modal
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
              OK
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


// --- STUDENT MANAGEMENT COMPONENT ---

interface StudentsProps {
  students: ApiStudent[];
  // Add a prop to refresh the data from the parent
  refreshData: () => void;
}

const Students: React.FC<StudentsProps> = ({ students, refreshData }) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ApiStudent | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

  const handleOpenNotificationModal = (student: ApiStudent) => {
    setSelectedStudent(student);
    setIsNotificationModalOpen(true);
  };

  const handleCloseNotificationModal = () => {
    setSelectedStudent(null);
    setIsNotificationModalOpen(false);
  };
  
  // This function is no longer needed as the modal is static
  // const handleNotificationSubmit = () => { ... };

  // Handle deleting a student
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    // A simple confirmation before deleting
    if (!window.confirm(`Are you sure you want to remove ${studentName}? This action cannot be undone.`)) {
      return;
    }
    
    setLoadingDelete(studentId);
    try {
      await deleteStudent(studentId);
      refreshData(); // Refresh the list after successful deletion
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student. Please try again.');
    } finally {
      setLoadingDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex justify-between items-center">
          Managed Student Profiles
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade/Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(students) && students.map(student => (
                <tr key={student._id} className="hover:bg-indigo-50/30 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={student.avatarUrl || "https://placehold.co/128x128/9CA3AF/ffffff?text=AV"} 
                        alt={student.childName} 
                      />
                      <div className="ml-4 font-medium text-gray-900">{student.childName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Grade {student.childGrade} - {student.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.isPremium ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-200 text-yellow-800 items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Premium
                      </span>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.progressStatus === 'needs_upgrade' 
                          ? 'bg-orange-100 text-orange-800' // New status
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.progressStatus === 'needs_upgrade' ? 'Needs Upgrade' : 'Standard'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {student.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(student.updatedAt)}
                  </td>

                  {/* --- ACTION BUTTONS UPDATED --- */}
                  <td className="px-6 py-4 whitespace-nowPrap text-sm font-medium">
                    {/* "Pay" (Upgrade) button now opens the static notification modal */}
                    {!student.isPremium && (
                      <button 
                        onClick={() => handleOpenNotificationModal(student)}
                        className="text-green-600 hover:text-green-800 mr-3 inline-flex items-center"
                      >
                        <ArrowUpCircle className="w-4 h-4 mr-1" />
                        Pay/Upgrade
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteStudent(student._id, student.childName)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                      disabled={loadingDelete === student._id}
                    >
                      {loadingDelete === student._id ? (
                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Render the new notification modal */}
      {isNotificationModalOpen && (
        <UpgradeNotificationModal
          student={selectedStudent}
          onClose={handleCloseNotificationModal}
          // The 'onSubmit' prop is no longer needed here
        />
      )}
    </>
  );
};

export default Students;