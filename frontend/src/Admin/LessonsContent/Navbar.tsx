import React from "react";

// Define the new NavBarProps interface
interface NavBarProps {
  curriculum: "Local" | "Cambridge";
  setCurriculum: React.Dispatch<React.SetStateAction<"Local" | "Cambridge">>;
  selectedSubject: string;
  setSelectedSubject: React.Dispatch<React.SetStateAction<string>>;
  
  // The selectedLevel prop now accepts a string
  selectedLevel: string;
  setSelectedLevel: React.Dispatch<React.SetStateAction<string>>;
  
  // A new prop to pass the list of levels
  levels: string[];
  
  hasContent: boolean;
}

const NavBar: React.FC<NavBarProps> = ({
  curriculum,
  setCurriculum,
  selectedSubject,
  setSelectedSubject,
  selectedLevel,
  setSelectedLevel,
  levels,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6 flex flex-wrap gap-4 items-center justify-between">
      {/* Curriculum Selector */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-white mb-1 font-semibold">Curriculum</label>
        <select
          value={curriculum}
          onChange={(e) => setCurriculum(e.target.value as "Local" | "Cambridge")}
          className="w-full p-2 border rounded bg-black text-white"
        >
          <option value="Local">Local</option>
          <option value="Cambridge">Cambridge</option>
        </select>
      </div>

      {/* Subject Selector */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-white mb-1 font-semibold">Subject</label>
        <input
          type="text"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          placeholder="Enter Subject"
          className="w-full p-2 border rounded bg-black text-white"
        />
      </div>

      {/* Level Selector */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-white mb-1 font-semibold">Difficulty Level</label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full p-2 border rounded bg-black text-white"
        >
          {/* Dynamically generate options from the passed levels prop */}
          {levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default NavBar;