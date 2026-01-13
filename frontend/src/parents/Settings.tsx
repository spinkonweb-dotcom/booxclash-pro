import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ParentProfile } from './dashboardTypes';
import { fetchProfile, uploadProfilePic, changePassword, logout, API_BASE } from './api';
import { User, Bell, Shield, LogOut, Upload, Loader2, AlertCircle } from 'lucide-react';

// A reusable component to show loading, success, or error messages
const FormStatus: React.FC<{
  message: string | null;
  isError: boolean;
}> = ({ message, isError }) => {
  if (!message) return null;
  return (
    <div
      className={`p-3 mt-3 rounded-md text-sm font-semibold flex items-center ${
        isError
          ? 'bg-red-100 text-red-700'
          : 'bg-green-100 text-green-700'
      }`}
    >
      <AlertCircle size={18} className="mr-2" />
      {message}
    </div>
  );
};

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile picture state
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch parent profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
      setUploadMessage(null);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file first.');
      return;
    }
    
    setUploadLoading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const updatedProfile = await uploadProfilePic(file);
      setProfile(updatedProfile); // Update profile with new pic URL
      setUploadMessage('Profile picture updated successfully!');
      setFile(null);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);

    try {
      await changePassword(oldPassword, newPassword);
      setPasswordMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear token and refresh the page to go to the login screen
      sessionStorage.removeItem('token');
      window.location.href = '/login'; 
    } catch (err: any) {
      alert(`Logout failed: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600">Error loading profile: {error}</p>;
  }

  return (
    <div className="space-y-12">
      {/* Profile Section */}
      {profile && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
            <User className="w-6 h-6 mr-2 text-indigo-600" />
            My Profile
          </h3>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0">
              <img
                // --- THIS IS THE FIX ---
                // Prepend the static folder path (e.g., /uploads/)
                src={profile.profilePic ? `${API_BASE}/uploads/${profile.profilePic}` : "https://placehold.co/128x128/9CA3AF/ffffff?text=AV"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
              />
              <form onSubmit={handleUpload} className="mt-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                  className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
                <button
                  type="submit"
                  disabled={!file || uploadLoading}
                  className="w-full mt-2 px-3 py-1.5 bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition flex items-center justify-center disabled:bg-gray-400"
                >
                  {uploadLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Upload size={16} className="mr-1.5" />
                      Upload
                    </>
                  )}
                </button>
                <FormStatus message={uploadMessage} isError={false} />
                <FormStatus message={uploadError} isError={true} />
              </form>
            </div>
            
            <div className="flex-grow space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-800">{profile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-lg font-semibold text-gray-800 capitalize">{profile.role}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-lg font-semibold text-gray-800">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <p className="text-lg font-semibold text-gray-800">{profile.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Approved</label>
                <p className={`text-lg font-semibold ${profile.isApproved ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.isApproved ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-teal-600" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
            <span className="text-gray-700">Receive weekly progress summary email.</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
            <span className="text-gray-700">Alert me when a student struggles with a topic.</span>
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-blue-600" />
          Security
        </h3>
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition flex items-center justify-center disabled:bg-gray-400"
          >
            {passwordLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Change Password'
            )}
          </button>
          <FormStatus message={passwordMessage} isError={false} />
          <FormStatus message={passwordError} isError={true} />
        </form>
      </div>

      {/* Logout Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
          <LogOut className="w-6 h-6 mr-2 text-red-600" />
          Sign Out
        </h3>
        <p className="text-gray-600 mb-4">Are you sure you want to sign out of your account?</p>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;