import { ApiStudent, ActivityFeedItem } from './dashboardTypes';

/**
 * Formats an ISO date string into a "time ago" format.
 * A simple version for this example.
 */
export const formatTimeAgo = (dateString: string): string => {
  // Add a quick check for invalid date strings
  if (!dateString) {
    return 'sometime ago';
  }

  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Prevent "in 5 seconds" if server time is slightly ahead
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

/**
 * Creates a merged, sorted "Recent Activity" feed from all children.
 */
export const generateActivityFeed = (students: ApiStudent[]): ActivityFeedItem[] => {
  // Guard clause for non-array or empty data
  if (!Array.isArray(students) || students.length === 0) {
    return [];
  }

  // Create an intermediate list that includes the raw date for sorting
  const allActivityWithDate = [];

  for (const student of students) {
    for (const lesson of student.lessonsCompleted) {
      allActivityWithDate.push({
        // --- FIX 1 ---
        // Use student._id directly
        id: `${student._id}-${lesson.lessonId}`,
        studentName: student.childName,
        message: `Completed "${lesson.title}"`,
        // --- FIX 2 ---
        // Store the raw date string for sorting
        rawTimestamp: lesson.completedAt, 
        type: lesson.type,
      });
    }
  }

  // Sort by the original date, descending (most recent first)
  allActivityWithDate.sort((a, b) => {
    // Convert to timestamp for reliable sorting
    const dateA = new Date(a.rawTimestamp).getTime();
    const dateB = new Date(b.rawTimestamp).getTime();
    return dateB - dateA;
  });

  // Now, take the top 10 and format the timestamp *after* sorting
  return allActivityWithDate.slice(0, 10).map(item => ({
    id: item.id,
    studentName: item.studentName,
    message: item.message,
    timestamp: formatTimeAgo(item.rawTimestamp), // Format date here
    type: item.type,
  }));
};

/**
 * Finds the student who may need the most help.
 * For example, the one with the fewest lessons completed.
 */
export const findFocusStudent = (students: ApiStudent[]): ApiStudent | null => {
  // Guard clause for non-array or empty data
  if (!Array.isArray(students) || students.length === 0) {
    return null;
  }
  
  // Find student with the fewest lessons
  return students.reduce((prev, curr) => 
    prev.lessonsCompleted.length < curr.lessonsCompleted.length ? prev : curr
  );
};