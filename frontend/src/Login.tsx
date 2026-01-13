import { useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import axios from "axios";

// Retain Navbar import just in case, but keep it minimal
const Navbar = lazy(() => import("./Navbar"));

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const Login = () => {
  const navigate = useNavigate();

  // State for the Parent/Adult login form (Email and Password)
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Removed all theme, Vanta, and child login states/logic/imports

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleParentSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });

      const { token, user } = response.data;

      if (!token) {
        throw new Error("No token received. Login failed.");
      }

      // ⚠️ IMPORTANT: Retaining the admin approval check from your original code
      if (user.role.toLowerCase() === "admin" && !user.isApproved) {
        alert("Your admin account is pending approval by the Super Admin.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("token", token);

      const role = user.role.toLowerCase();

      // Basic routing based on the user's role
      switch (role) {
        case "superadmin":
        case "admin":
          navigate("/dashboard/admin");
          break;
        case "parent":
          navigate("/child-selector");
          break;
        case "school":
          navigate("/dashboard/school");
          break;
        default:
          navigate("/dashboard/guest");
          break;
      }
    } catch (err) {
      let msg = "An unknown error occurred";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`Login failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Removed Child Submit Handler since we only want Email/Password

  // Minimalist rendering
  return (
    <div className="relative min-h-screen bg-blue-900">
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <Navbar />
      </Suspense>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-500">Welcome Back</p>
          </div>

          <form onSubmit={handleParentSubmit} className="space-y-5">
            
            {/* EMAIL FIELD */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 bg-blue-600 hover:bg-blue-700 shadow-md ${
                loading
                  ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                  : ""
              }`}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account?{" "}
                <span
                  className="text-blue-600 underline cursor-pointer hover:text-blue-700 font-medium"
                  onClick={() => navigate("/signup")}
                >
                  Sign up here
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
