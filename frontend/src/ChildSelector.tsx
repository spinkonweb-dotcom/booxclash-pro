import React, { useState, useEffect } from "react";
// 1. Properly import useNavigate for routing
import { useNavigate } from "react-router-dom";

// Define API_BASE outside of components as it's used globally
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080"; // Update to your backend URL

/**
 * ChildProfile Interface
 * Represents the flat structure of a single child object returned by the API.
 */
interface ChildProfile {
  _id: string;
  childName: string;
  avatarUrl?: string;
  isPremium: boolean;
  progressStatus: "active" | "needs_upgrade" | "premium";
  curriculum: string;
  subject: string;
  childGrade: string;
}

/**
 * PasswordModal
 * Handles the password prompt and remote authentication logic using the existing token.
 */
const PasswordModal: React.FC<{ isOpen: boolean, onClose: () => void, onAuthenticated: () => void }> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = sessionStorage.getItem("token");

    if (!token) {
        setError("User session expired. Please log in again.");
        setLoading(false);
        // navigate('/login') // In a full app, you would redirect here
        return;
    }
    
    // NOTE: Using the protected /api/reauth-password endpoint added in the backend.
    try {
        const response = await fetch(`${API_BASE}/api/reauth-password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Authenticate the user's identity
            },
            body: JSON.stringify({
                // Only send the password for verification
                password: password, 
            }),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { error: response.statusText };
            }
            
            const apiErrorMsg = errorData.error || `Error ${response.status}: Password verification failed.`;
            
            setError(apiErrorMsg); 
            console.error("Password Verification failed:", response.status, apiErrorMsg);

            setPassword("");
            return;
        }
        
        // Authentication successful
        onAuthenticated(); // Proceed to dashboard

    } catch (networkError) {
        console.error("Network error during password verification:", networkError);
        setError("Network error: Could not connect to the verification server.");
        setPassword("");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 transition-opacity duration-300">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Verify Parent Access
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Please enter your password to access the sensitive progress dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={`w-full p-3 mb-4 border-2 rounded-lg text-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ${error ? 'border-red-500' : 'border-gray-300'}`}
            required
            disabled={loading}
          />
          {error && (
            <p className="text-red-600 mb-4 font-medium text-sm">{error}</p>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-150"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Access dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ChildSelector: React.FC = () => {
  // 2. Initialize the navigate function
  const navigate = useNavigate(); 
  
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  useEffect(() => {
    const fetchChildren = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Now uses real navigate
        console.log("No token found, redirecting to /login");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/children/my-children`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Could not fetch children's profiles.");
        }

        const data = await response.json();
        setChildren(data.children);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [navigate]); // navigate is included in

  const handleChildSelect = async (child: ChildProfile) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login"); // Now uses real navigate
      console.log("No token found, redirecting to /login");
      return;
    }

    try {
      console.log(`Fetching latest data for ${child.childName}...`);

      const response = await fetch(
        `${API_BASE}/api/children/${child._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not refresh child data. Please try again.");
      }

      const data = await response.json();
      const freshChildData: ChildProfile = data.child; // Assuming the API returns a flat child object in 'data.child'

      console.log("Fresh data received:", freshChildData);

      sessionStorage.setItem("childData", JSON.stringify(freshChildData));

      const normalizedSubject = freshChildData.subject
        .toLowerCase()
        .trim()
        .replace(/[/]/g, '-')        // Replace all slashes
        .replace(/\s+/g, '-')        // Replace ALL spaces
        .replace(/[^a-z0-9-]/g, ''); // Remove remaining special characters
        navigate(
          `/FoundationDashboard/${freshChildData.curriculum}/${normalizedSubject}/${freshChildData.childGrade}`,
          { state: { child: freshChildData } }
        );

    } catch (error) {
      console.error(error);
      console.error("There was an issue loading the profile. Please try again.");
    }
  };

  const handleAddChild = () => {
    navigate("/child-setup"); // Now uses real navigate
  };

  /**
   * Opens the password modal.
   */
  const handleParentdashboard = () => {
    setIsModalOpen(true);
  };
  
  /**
   * Function to execute after successful authentication.
   */
  const handledashboardAuthenticated = () => {
    setIsModalOpen(false); // Close the modal
    // 3. Now perform the actual navigation
    navigate("/parent-dashboard"); 
    console.log("Authentication successful! Navigating to Parent Dashboard");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-700">
          Loading profiles...
        </div>
      </div>
    );
  }

  // Explicitly type the mock data array to ChildProfile[] to resolve the type union issue
  const mockChildren: ChildProfile[] = [
    { _id: 'mock1', childName: 'Mock Child 1', isPremium: true, progressStatus: 'premium', curriculum: 'A', subject: 'Math', childGrade: '1', avatarUrl: "https://placehold.co/128x128/60A5FA/ffffff?text=M1" },
    { _id: 'mock2', childName: 'Mock Child 2', isPremium: false, progressStatus: 'needs_upgrade', curriculum: 'B', subject: 'Science', childGrade: '3', avatarUrl: "https://placehold.co/128x128/FBBF24/ffffff?text=M2" },
  ];
  
  const displayChildren: ChildProfile[] = children.length > 0 ? children : mockChildren;


  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      
      {/* 1. Parent dashboard Button - Positioned in the top right */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <button
          onClick={handleParentdashboard}
          className="flex items-center space-x-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105 text-sm md:text-base"
        >
          {/* Lucide Chart Bar Icon - representing progress/dashboard */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="12" x2="12" y1="20" y2="10" />
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
          </svg>
          <span className="hidden sm:inline">Parent Dashboard</span>
          <span className="inline sm:hidden">Dashboard</span>
        </button>
      </div>

      <h1 className="text-4xl font-bold text-gray-800 mb-8 mt-12 md:mt-0">
        Who is learning today?
      </h1>

      {/* 2. Child Selection Profiles */}
      <div className="flex flex-wrap justify-center gap-8">
        {displayChildren.map((child) => (
          <div
            key={child._id}
            onClick={() => handleChildSelect(child)}
            className="flex flex-col items-center cursor-pointer group text-center"
          >
            <img
              src={child.avatarUrl || "https://placehold.co/128x128/9CA3AF/ffffff?text=AV"}
              alt={child.childName}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg transition-transform group-hover:scale-110 object-cover"
              // Fallback for missing avatarUrl
              onError={(e) => {
                // Use a placeholder if the provided avatar URL fails
                e.currentTarget.src = "https://placehold.co/128x128/9CA3AF/ffffff?text=AV";
              }}
            />
            <p className="mt-4 text-2xl font-semibold text-gray-700">
              {child.childName}
            </p>
          </div>
        ))}

        {/* Add new child button */}
        <div
          onClick={handleAddChild}
          className="flex flex-col items-center cursor-pointer group text-center"
        >
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white shadow-lg transition-transform group-hover:scale-110">
            <span className="text-5xl text-gray-400">+</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-700">
            Add Profile
          </p>
        </div>
      </div>

      {/* 3. Password Modal Integration */}
      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAuthenticated={handledashboardAuthenticated}
      />
    </div>
  );
};

export default ChildSelector;