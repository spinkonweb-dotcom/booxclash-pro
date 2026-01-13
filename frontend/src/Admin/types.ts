// src/types.ts

// This interface matches your Mongoose User Schema
export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  password?: string; // Only needed for creation/update
  country?: string;
  city?: string;
  role: 'student' | 'educator' | 'admin' | 'parent' | 'school' | 'guest';
  verified: boolean;
  profilePic?: string;
  parentId?: string;
  curriculum: 'Local' | 'Cambridge';
  learningPhase?: 'Foundation' | 'Intermediate' | 'Advanced';
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean; // For admin approval status
  // Add other nested fields if you need to manage them
}