import React from "react";
import { Star, Flame, BookOpen } from "lucide-react";

interface ChildData {
  childName: string;
  avatarUrl?: string;
  points: number;
  streak: number;
  subject: string;
}

interface NavbarProps {
  childData: ChildData;
}

// Small helper for displaying each stat item
const StatItem: React.FC<{ icon: React.ReactNode; value: string | number }> = ({
  icon,
  value,
}) => (
  <div className="flex items-center gap-2 bg-black bg-opacity-25 px-3 py-1.5 rounded-lg">
    {icon}
    <span className="font-bold text-sm sm:text-lg">{value}</span>
  </div>
);

const Navbar: React.FC<NavbarProps> = ({ childData }) => {
  const displaySubject =
    childData.subject.charAt(0).toUpperCase() +
    childData.subject.slice(1).replace("-", " & ");

  return (
    <nav className="w-full bg-[#2a1d19] text-white p-3 shadow-lg flex justify-between items-center">
      {/* Left Side — Avatar + Name */}
      <div className="flex items-center gap-3">
        <img
          src={childData.avatarUrl || "/images/default_avatar.png"}
          alt={childData.childName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-yellow-400"
        />

        {/* Child name (hidden on small screens) */}
        <div className="hidden sm:block">
          <h1 className="text-lg sm:text-xl font-bold">{childData.childName}</h1>
        </div>
      </div>

      {/* Right Side — Stats */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Subject — hidden on small screens */}
        <div className="hidden sm:block">
          <StatItem
            icon={<BookOpen size={20} className="text-cyan-300" />}
            value={displaySubject}
          />
        </div>

        {/* Points */}
        <StatItem
          icon={<Star size={20} className="text-yellow-400" />}
          value={childData.points}
        />

        {/* Streak */}
        <StatItem
          icon={<Flame size={20} className="text-orange-400" />}
          value={childData.streak}
        />
      </div>
    </nav>
  );
};

export default Navbar;