// src/components/UserFormModal.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from './types';
import './UserFormModal.css';

interface Props {
  user: User | null;
  onClose: (shouldRefresh: boolean) => void;
  apiBaseUrl: string;
}

const UserFormModal: React.FC<Props> = ({ user, onClose, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    country: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = user !== null;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Password is not sent for editing, only for changing
        role: user.role,
        country: user.country || '',
      });
    }
  }, [user, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    // Don't send empty password field on update
    const payload = { ...formData };
    if (isEditMode && !payload.password) {
      delete (payload as any).password;
    }

    try {
      if (isEditMode) {
        // Update user
        await axios.put(`${apiBaseUrl}/api/admin/users/${user._id}`, payload, config);
      } else {
        // Create user
        await axios.post(`${apiBaseUrl}/api/admin/users`, payload, config);
      }
      onClose(true); // Close modal and signal a refresh
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{isEditMode ? 'Edit User' : 'Create User'}</h2>
        {error && <p className="modal-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? 'Leave blank to keep current' : ''} />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="educator">Educator</option>
              <option value="admin">Admin</option>
              <option value="school">School</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={() => onClose(false)}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;