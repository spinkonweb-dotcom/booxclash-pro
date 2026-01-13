import { useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/api/change-password`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    alert(data.message || "Password updated");
  };

  return (
    <form onSubmit={handleChange} className="space-y-4">
      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="block w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="block w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Change Password
      </button>
    </form>
  );
};

export default ChangePassword;
