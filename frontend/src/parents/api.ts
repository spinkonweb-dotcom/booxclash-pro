import { ApiStudent, ParentProfile } from './dashboardTypes';

// Use the same API_BASE as your other calls
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080"; 

/**
 * Retrieves the auth token from storage.
 */
const getAuthHeaders = (isFormData: boolean = false) => {
  const token = sessionStorage.getItem('token'); 
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  // For FormData, 'Content-Type' is set automatically by the browser
  
  return headers;
};

/**
 * Fetches all children for the currently logged-in parent.
 */
export const fetchMyChildren = async (): Promise<ApiStudent[]> => {
  const response = await fetch(`${API_BASE}/api/children/my-children`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch children');
  }
  const data = await response.json();
  if (data && Array.isArray(data.children)) {
    return data.children;
  }
  if (Array.isArray(data)) {
    return data;
  }
  console.warn('API /api/children/my-children did not return a valid array. Got:', data);
  return []; 
};

/**
 * Fetches the AI recommendation from our secure backend.
 */
export const fetchAiRecommendation = async (studentDataPrompt: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/ai/recommendation`, {
      method: 'POST',
      headers: getAuthHeaders(), // Send auth token
      body: JSON.stringify({ studentDataPrompt: studentDataPrompt }) // Send the prompt
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `API returned status ${response.status}.`);
    }

    const result = await response.json();
    return result.recommendation || "No recommendation generated.";

  } catch (e: any) {
    console.error("AI Recommendation Error:", e);
    throw new Error(e.message || "Could not generate recommendations.");
  }
};

/**
 * Deletes a student profile.
 */
export const deleteStudent = async (studentId: string): Promise<void> => {
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

// --- NEW SETTINGS API FUNCTIONS ---

/**
 * Fetches the logged-in parent's profile.
 * Assumes a parent-specific route like /api/auth/profile
 */
export const fetchProfile = async (): Promise<ParentProfile> => {
  const response = await fetch(`${API_BASE}/api/profile`, { // Using /api/auth/profile
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch profile');
  }
  return response.json();
};

/**
 * Uploads a new profile picture.
 * Assumes a route like /api/auth/upload-pic
 */
export const uploadProfilePic = async (file: File): Promise<ParentProfile> => {
  const formData = new FormData();
  formData.append('profilePic', file); // 'profilePic' is the field name

  const response = await fetch(`${API_BASE}/api/upload-profile-pic`, { // Using /api/auth/upload-pic
    method: 'POST',
    headers: getAuthHeaders(true), // Pass true for FormData
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to upload image');
  }
  // Return the updated profile object
  return response.json(); 
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/change-password`, { // Using /api/auth/change-password
    method: 'POST',
    headers: getAuthHeaders(),
    // --- THIS IS THE FIX ---
    // Change 'oldPassword' to 'currentPassword' to match the backend
    body: JSON.stringify({ currentPassword: oldPassword, newPassword: newPassword })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to change password');
  }
  return;
};

/**
 * Logs the parent out.
 */
export const logout = async (): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/logout`, { // Using /api/auth/logout
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Logout failed');
  }
  return;
};