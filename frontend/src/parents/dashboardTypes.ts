/**
 * A single completed lesson object from the API.
 */
export interface Lesson {
  lessonId: string;
  title: string;
  type: 'lesson' | 'topic';
  completedAt: string; 
}

/**
 * The child data structure from your API.
 */
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

/**
 * A transformed object for the "Recent Activity" feed.
 */
export interface ActivityFeedItem {
  id: string;
  studentName: string;
  message: string;
  timestamp: string;
  type: 'lesson' | 'topic';
}

/**
 * NEW: The parent's profile data structure.
 */
export interface ParentProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'parent' | 'admin' | 'superadmin';
  profilePic: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}