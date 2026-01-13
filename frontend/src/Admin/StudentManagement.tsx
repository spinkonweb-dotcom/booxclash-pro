import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const StudentManagement = () => {
  interface Student {
    _id: string;
    name: string;
    username: string;
    email: string;
    country: string;
    city: string;
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    country: "",
    city: "",
  });

  const fetchStudents = async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/students`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch students");
    return data;
  };

  const handleRemoveStudent = async (id: string) => {
    try {
      const token = sessionStorage.getItem("token"); // or wherever you store it
      const res = await fetch(`${API_BASE}/api/students/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // add token here
        },
      });
  
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove student");
      }
  
      const updatedList = students.filter((student) => student._id !== id);
      setStudents(updatedList);
      sessionStorage.setItem("students", JSON.stringify(updatedList));
    } catch (err) {
      console.error("Failed to remove student:", err);
      alert("Error removing student.");
    }
  };
  

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token"); // Get the token from sessionStorage
      if (!token) throw new Error("No token provided.");
  
      const res = await fetch(`${API_BASE}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token to headers
        },
        body: JSON.stringify({ ...form, role: "student" }),
      });
  
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add student");
      }
  
      const addedStudent = await res.json();
      const updatedList = [...students, addedStudent];
      setStudents(updatedList);
      sessionStorage.setItem("students", JSON.stringify(updatedList));
  
      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        country: "",
        city: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add student:", err);
      alert("Error adding student.");
    }
  };
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("students");
    if (cached) {
      setStudents(JSON.parse(cached));
    } else {
      fetchStudents()
        .then((data) => {
          setStudents(data);
          sessionStorage.setItem("students", JSON.stringify(data));
        })
        .catch(console.error);
    }
  }, []);

  return (
    <div>
      <button
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setShowForm(true)}
      >
        Add Student
      </button>

      {showForm && (
        <form
          onSubmit={handleAddStudent}
          className="bg-gray-100 p-4 rounded mb-4 shadow"
        >
          <div className="grid grid-cols-2 gap-4 mb-2">
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="p-2 border rounded" />
            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required className="p-2 border rounded" />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className="p-2 border rounded" />
            <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className="p-2 border rounded" />
            <input name="country" placeholder="Country" value={form.country} onChange={handleChange} className="p-2 border rounded" />
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="p-2 border rounded" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <table className="w-full text-left border border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Username</th>
            <th className="border px-4 py-2">Country</th>
            <th className="border px-4 py-2">City</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td className="border px-4 py-2">{student.name}</td>
              <td className="border px-4 py-2">{student.email}</td>
              <td className="border px-4 py-2">{student.username}</td>
              <td className="border px-4 py-2">{student.country}</td>
              <td className="border px-4 py-2">{student.city}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleRemoveStudent(student._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentManagement;
