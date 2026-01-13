import React, { useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";

const Navbar = lazy(() => import("./Navbar"));
 
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const BACKGROUND_GRADIENT_CLASS = "bg-gradient-to-br from-orange-400 via-purple-500 to-blue-500"; 

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", 
    email: "",
    phone: "", 
    password: "", 
  });

  const [loading, setLoading] = useState(false);

  // --- CHANGE 1: Improved handleChange to handle phone input ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Allow only numbers and limit the length to 9 digits
      const numericValue = value.replace(/[^0-9]/g, '');
      setForm((prev) => ({ ...prev, [name]: numericValue.slice(0, 9) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // --- CHANGE 2: Automatically format the phone number before sending ---
    // This combines the country code with the user's input.
    const formattedPhone = `+260${form.phone.trim()}`;

    const payload = {
      name: form.name.trim(), 
      username: form.email.toLowerCase().trim().split('@')[0] || `user_${Date.now()}`, 
      role: "parent", 
      email: form.email.toLowerCase().trim(),
      phone: formattedPhone, // Use the formatted number
      password: form.password,
    };

    // --- Validation for phone number length ---
    if (form.phone.trim().length !== 9) {
      alert("Please enter a valid 9-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      const signupRes = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!signupRes.ok) {
        const error = await signupRes.json();
        throw new Error(error.error || "Signup failed");
      }

      const data = await signupRes.json();
      sessionStorage.setItem("token", data.token);

      alert(`Signup successful! Welcome, ${data.user.name}! Setting up your child's profile now.`);
      
      navigate("/child-setup");

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen ${BACKGROUND_GRADIENT_CLASS}`}>
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <Navbar />
      </Suspense>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-gray-500">Sign up in seconds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* NAME FIELD (No change) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" name="name" placeholder="Full Name (for billing)" value={form.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"/>
            </div>

            {/* EMAIL FIELD (No change) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"/>
            </div>
            
            {/* --- CHANGE 3: Updated Phone Number Field UI --- */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">+260</span>
                </div>
                <input
                  type="tel" 
                  name="phone"
                  id="phone"
                  placeholder="971234567"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* PASSWORD FIELD (No change) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"/>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-[1.01] bg-blue-600 hover:bg-blue-700 shadow-md ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}>
              {loading ? "Creating Account..." : "Create Account & Setup Child"}
            </button>

            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Already have an account?{" "}
                <span className="text-blue-600 underline cursor-pointer hover:text-blue-700 font-medium" onClick={() => navigate("/login")}>
                  Sign in here
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
