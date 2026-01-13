import React from 'react';
import { Users, BookOpen, TrendingUp, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { ApiStudent, ActivityFeedItem } from './dashboardTypes';
// No 'formatTimeAgo' needed here, as the activityFeed prop is pre-formatted
import AiRecommendationCard from './AiRecommendationCard';

// --- UTILITY COMPONENTS ---

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string, color: string }> = ({ icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-xl">
    <div className={`text-3xl p-3 rounded-full inline-flex ${color} bg-opacity-10 mb-4`}>
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <h2 className="text-3xl font-bold text-gray-800 mt-1">{value}</h2>
  </div>
);

// This component receives the pre-processed 'ActivityFeedItem'
const ActivityItem: React.FC<{ item: ActivityFeedItem }> = ({ item }) => {
  const IconComponent = item.type === 'topic' ? CheckCircle : BookOpen;
  const colorClasses = item.type === 'topic' ? 'text-green-500 bg-green-50' : 'text-blue-500 bg-blue-50';

  return (
    <div className="flex items-start p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition duration-150">
      <div className={`p-2 rounded-full mr-4 ${colorClasses}`}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-grow">
        <p className="font-medium text-gray-800 leading-snug">
          <span className="font-bold">{item.studentName}:</span> {item.message}
        </p>
        <p className="text-xs text-gray-400 mt-1 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {item.timestamp} {/* This is already formatted as "time ago" */}
        </p>
      </div>
    </div>
  );
};

// --- MAIN PROGRESS COMPONENT ---

interface ProgressOverviewProps {
  students: ApiStudent[];
  activityFeed: ActivityFeedItem[];
  focusStudent: ApiStudent | null;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({ students, activityFeed, focusStudent }) => {
  // --- Calculate Stats from Props ---
  const totalLessons = students.reduce((sum, s) => sum + s.lessonsCompleted.length, 0);
  
  const activeStudents = students.filter(s => {
    // FIX: Use the simple string date 'updatedAt'
    const lastActive = new Date(s.updatedAt); 
    const now = new Date();
    const hoursAgo = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    return hoursAgo <= 24;
  }).length;

  // This is an assumption. Ideally, your API would provide this.
  const TOTAL_LESSONS_PER_CURRICULUM = 100; 

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Users />}
          title="Managed Students"
          value={students.length.toString()}
          color="text-indigo-600"
        />
        <StatCard
          icon={<BarChart3 />}
          title="Total Lessons Completed"
          value={totalLessons.toString()}
          color="text-teal-600"
        />
        <StatCard
          icon={<TrendingUp />}
          title="Active in 24h"
          value={`${activeStudents} students`}
          color="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendation Card (Receives focusStudent) */}
        <div className="lg:col-span-3">
          <AiRecommendationCard focusStudent={focusStudent} />
        </div>

        {/* Student Progress List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Student Progress Snapshot</h3>
          <div className="space-y-4">
            {students.map(student => {
              const progressPercent = Math.min(
                (student.lessonsCompleted.length / TOTAL_LESSONS_PER_CURRICULUM) * 100,
                100
              );

              return (
                // FIX: Use student._id
                <div key={student._id} className="border-b pb-4 last:border-b-0 flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={student.avatarUrl || "https://placehold.co/128x128/9CA3AF/ffffff?text=AV"}
                      alt={student.childName}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{student.childName}</p>
                      {/* FIX: childGrade is now a string */}
                      <p className="text-sm text-gray-500">Grade {student.childGrade} - {student.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{student.points} pts</p>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <h3 className="text-xl font-bold text-gray-800 p-6 pb-2">Recent Activity</h3>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {activityFeed.map(item => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
          <div className="p-4 text-center border-t border-gray-100">
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              View Full History
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProgressOverview;