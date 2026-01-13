import { useState } from "react";
import Profile from "../Profile";
import FoundationContent from "./FoundationContent";
import UserManagement from "./UserManagement";
import KnockoutGame from "../Games/KnockoutGame";
import Questions from "./LessonsContent/Questions";
import ParentManagement from "./ParentManagement";
import AdminPDFUpload from "./AdminPDFUpload";

const adminMenu = [
  "Profile",
  "User Management",
  "Foundation Content",
  "Quiz Questions Upload",
  "Parent Management",
  "Subscribers",
  "Analytics",
  "Settings",
  "Logout",
];

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("Profile");

  const renderContent = () => {
    switch (activeMenu) {
      case "Profile":
        return <Profile />;
      case "User Management":
        return <UserManagement />;
      case "Foundation Content":
        return <FoundationContent />;
      case "Quiz Questions Upload":
        return <Questions />;
      case "Parent Management":
        return <ParentManagement />;
      case "Subscribers":
        return <AdminPDFUpload />;
      case "Analytics":
        return <KnockoutGame/>;
      case "Settings":
        return <div>System Settings</div>;
      case "Logout":
        // Add logout logic here
        return <div>Logging out...</div>;
      default:
        return <div>Select a menu</div>;
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <ul className="space-y-3">
          {adminMenu.map((item) => (
            <li
              key={item}
              onClick={() => setActiveMenu(item)}
              className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-700 transition ${
                activeMenu === item ? "bg-gray-700" : ""
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 bg-gray-100 p-6">
        <h3 className="text-2xl font-semibold mb-4">{activeMenu}</h3>
        <div className="bg-white rounded p-4 shadow-md">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
