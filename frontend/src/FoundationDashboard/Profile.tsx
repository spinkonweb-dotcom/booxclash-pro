import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Globe, MapPin, Shield, GraduationCap, Users, Camera, Lock, Palette, ChevronDown, CheckCircle, XCircle, Crown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Theme definitions matching ChildManagement
const themes = {
  purple: {
    name: "Purple Focus",
    primary: "from-purple-900 via-purple-800 to-indigo-900",
    secondary: "from-purple-600 to-indigo-600",
    accent: "bg-purple-600",
    accentHover: "hover:bg-purple-700",
    text: "text-purple-700",
    lightText: "text-purple-300",
    cardBg: "bg-white/95",
    border: "border-purple-200",
    glowEffect: "shadow-purple-500/20"
  },
  green: {
    name: "Nature Green",
    primary: "from-emerald-900 via-green-800 to-teal-900",
    secondary: "from-emerald-600 to-green-600",
    accent: "bg-emerald-600",
    accentHover: "hover:bg-emerald-700",
    text: "text-emerald-700",
    lightText: "text-emerald-300",
    cardBg: "bg-white/95",
    border: "border-emerald-200",
    glowEffect: "shadow-emerald-500/20"
  },
  blue: {
    name: "Ocean Blue",
    primary: "from-blue-900 via-cyan-800 to-blue-900",
    secondary: "from-blue-600 to-cyan-600",
    accent: "bg-blue-600",
    accentHover: "hover:bg-blue-700",
    text: "text-blue-700",
    lightText: "text-blue-300",
    cardBg: "bg-white/95",
    border: "border-blue-200",
    glowEffect: "shadow-blue-500/20"
  }
};

type UserProfile = {
  _id: string;
  name: string;
  username?: string | null;
  email?: string | null;
  country?: string | null;
  city?: string | null;
  role: "student" | "educator" | "admin" | "parent" | "school" | "guest";
  verified: boolean;
  profilePic?: string | null;
  parentId?: string | null;
  curriculum?: "Local" | "Cambridge" | null;
  grade?: string | null;
  subscription?: {
    plan: 'none' | 'one_child' | 'family' | 'school' | 'enterprise';
    status: 'active' | 'inactive' | 'pending' | 'cancelled';
    startDate?: string | null;
    endDate?: string | null;
    childrenLimit?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function Profile() {
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('purple');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const theme = themes[currentTheme];

  useEffect(() => {
    const tokenFromStorage = sessionStorage.getItem("token");
    if (tokenFromStorage) {
      setToken(tokenFromStorage);
    } else {
      alert("Please log in to view your profile.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) return;
    axios
      .get<UserProfile>(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          sessionStorage.removeItem("token");
          navigate("/login");
        } else {
          alert("Failed to fetch profile data. Please try again later.");
        }
      });
  }, [token, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/api/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.message || "Failed to update password.");
      } else {
        alert("Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadProfilePic = async () => {
    if (!selectedFile || !token) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("profilePic", selectedFile);
    try {
      await axios.post(`${API_BASE}/api/upload-profile-pic`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Profile picture updated!");
      setSelectedFile(null);
      const res = await axios.get<UserProfile>(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'parent': return <Users className="w-5 h-5 text-blue-500" />;
      case 'student': return <GraduationCap className="w-5 h-5 text-green-500" />;
      case 'educator': return <Shield className="w-5 h-5 text-purple-500" />;
      case 'school': return <Shield className="w-5 h-5 text-indigo-500" />;
      default: return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themes.purple.primary} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.primary} p-4 sm:p-6 md:p-8 relative`}>
      {/* Theme Selector */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`${theme.cardBg} backdrop-blur-sm rounded-lg p-3 border ${theme.border} shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2`}
          >
            <Palette className={theme.text} size={20} />
            <span className={`hidden sm:inline text-sm font-medium ${theme.text}`}>Theme</span>
            <ChevronDown className={`${theme.text} transition-transform duration-200 ${isThemeMenuOpen ? 'rotate-180' : ''}`} size={16} />
          </button>
          
          {isThemeMenuOpen && (
            <div className={`absolute top-full right-0 mt-2 ${theme.cardBg} backdrop-blur-sm rounded-lg border ${theme.border} shadow-xl overflow-hidden min-w-[160px]`}>
              {Object.entries(themes).map(([key, themeOption]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key as keyof typeof themes);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 ${
                    currentTheme === key ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${themeOption.secondary}`}></div>
                  <span className="text-sm font-medium text-gray-700">{themeOption.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8 pt-12 md:pt-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">User Profile</h1>
          <p className="text-base sm:text-lg text-purple-200">Manage your account settings and information</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className={`lg:col-span-2 ${theme.cardBg} backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border ${theme.border}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4 flex-shrink-0">
                <div className="relative">
                  <img
                    src={
                      user.profilePic
                        ? `${API_BASE}/uploads/${user.profilePic}?t=${Date.now()}`
                        : `https://ui-avatars.com/api/?name=${user.name}&background=random`
                    }
                    alt="Profile"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-lg object-cover"
                    style={{ borderColor: currentTheme === 'purple' ? '#9333ea' : currentTheme === 'green' ? '#059669' : '#2563eb' }}
                  />
                  {user.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Upload Section */}
                <div className="w-full max-w-[200px]">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="profile-upload"
                  />
                  <label
                    htmlFor="profile-upload"
                    className={`w-full flex items-center justify-center gap-2 ${theme.accent} ${theme.accentHover} text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer hover:scale-105 text-sm`}
                  >
                    <Camera size={16} />
                    Choose Photo
                  </label>
                  
                  {selectedFile && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="truncate flex-1">{selectedFile.name}</span>
                      </div>
                      <button
                        onClick={handleUploadProfilePic}
                        disabled={loading}
                        className={`w-full ${theme.accent} ${theme.accentHover} text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                      >
                        {loading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="flex-1 w-full space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <h2 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>{user.name}</h2>
                  {getRoleIcon(user.role)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.username && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
                        <p className="text-gray-800 font-medium">{user.username}</p>
                      </div>
                    </div>
                  )}

                  {user.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-gray-800 font-medium">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Country</p>
                      <p className="text-gray-800 font-medium">{user.country || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">City</p>
                      <p className="text-gray-800 font-medium">{user.city || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                      <p className="text-gray-800 font-medium capitalize">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {user.verified ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Verification</p>
                      <p className={`font-medium ${user.verified ? 'text-green-600' : 'text-red-600'}`}>
                        {user.verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student-specific fields */}
                {user.role === 'student' && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className={`text-base sm:text-lg font-semibold ${theme.text} mb-3`}>Student Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {user.curriculum && (
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Curriculum</p>
                            <p className="text-gray-800 font-medium">{user.curriculum}</p>
                          </div>
                        </div>
                      )}
                      {user.grade && (
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p>
                            <p className="text-gray-800 font-medium">{user.grade}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          {(user.role === 'parent' || user.role === 'school') && user.subscription && (
            <div className={`${theme.cardBg} backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border ${theme.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <Crown className={theme.text} size={24} />
                <h3 className={`text-lg sm:text-xl font-bold ${theme.text}`}>Subscription</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Plan</p>
                  <p className="text-gray-800 font-bold capitalize">{user.subscription.plan.replace(/_/g, ' ')}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className={`font-bold capitalize ${getSubscriptionStatusColor(user.subscription.status)}`}>
                    {user.subscription.status}
                  </p>
                </div>

                {user.subscription.endDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Valid Until</p>
                    <p className="text-gray-800 font-medium">
                      {new Date(user.subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Change Password Card */}
          <div className={`lg:col-span-${(user.role === 'parent' || user.role === 'school') && user.subscription ? '2' : '1'} ${theme.cardBg} backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border ${theme.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <Lock className={theme.text} size={24} />
              <h3 className={`text-lg sm:text-xl font-bold ${theme.text}`}>Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Current Password"
                  className={`w-full pl-9 pr-3 py-2.5 border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="New Password"
                  className={`w-full pl-9 pr-3 py-2.5 border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${theme.accent} ${theme.accentHover} text-white py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${theme.glowEffect}`}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}