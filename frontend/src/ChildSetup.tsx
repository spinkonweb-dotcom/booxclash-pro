import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Smile, 
  Book, 
  Image as ImageIcon, 
  MapPin, 
  Globe, 
  Layers 
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080"; // Adjust as needed

const BACKGROUND_GRADIENT_CLASS =
  "bg-gradient-to-br from-orange-400 via-purple-500 to-blue-500";

interface DecodedToken {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
}

interface ChildForm {
  childName: string;
  country: string;
  curriculum: string;
  // childGrade must hold strings for "Starter", "Basic", etc.
  childGrade: string; 
  subject: string;
  avatarUrl: string;
}

interface CountryData {
  name: { common: string };
}

const DEFAULT_AVATARS = [
  "/images/cat.png",
  "/images/dog.png",
  "/images/girl.png",
  "/images/panda.png",
  "/images/rabbit.png",
  "/images/user.png",
];

const READING_LEVELS = [
  "Starter",
  "Basic",
  "Developing",
  "Confident",
  "Proficient",
  "Mastery",
];

const GRADE_OPTIONS = [1, 2, 3]; // Numerical grades

const ChildSetup = () => {
  const navigate = useNavigate();

  const [childForm, setChildForm] = useState<ChildForm>({
    childName: "",
    country: "",
    curriculum: "",
    childGrade: "",
    subject: "",
    avatarUrl: "",
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<File | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  // --- USE EFFECTS ---

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded?.id) {
          setParentId(decoded.id);
        }
      } catch (err) {
        console.error("Token decoding failed:", err);
      }
    }
  }, []);

  // Fetch Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      // ... (country fetching logic remains the same)
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
        const data: CountryData[] = await response.json();
        
        const countryList = data
          .map((c) => c.name.common)
          .sort((a, b) => a.localeCompare(b));

        setCountries(countryList);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
        setCountries(["Zambia", "United Kingdom", "United States", "South Africa"]); 
      }
    };
    fetchCountries();
  }, []);

  // Handle Country/Curriculum Lock
  useEffect(() => {
    if (childForm.country && childForm.country !== "Zambia") {
      setChildForm((prev) => ({ ...prev, curriculum: "Cambridge" }));
    }
  }, [childForm.country]);

  // Reset Subject and Grade/Level when Curriculum changes
  useEffect(() => {
    setChildForm((prev) => ({ ...prev, subject: "", childGrade: "" }));
  }, [childForm.curriculum]);

  // ✅ NEW: Reset Grade/Level when Subject changes (since options are conditional)
  useEffect(() => {
    setChildForm((prev) => ({ ...prev, childGrade: "" }));
  }, [childForm.subject]);


  // --- HANDLERS ---

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setChildForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setCustomAvatar(null);
    setChildForm((prev) => ({ ...prev, avatarUrl }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAvatar(file);
      setChildForm((prev) => ({
        ...prev,
        avatarUrl: URL.createObjectURL(file),
      }));
    }
  };

  // ✅ Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentId) {
      navigate("/login");
      return;
    }
    
    // Check if the grade/level is set (required for all flows)
    if (!childForm.childGrade) {
        alert("Please select a Reading Level or Grade/Stage.");
        return;
    }

    const payload: any = {
      parentId,
      childName: childForm.childName.trim(),
      country: childForm.country,
      curriculum: childForm.curriculum,
      // ⚠️ IMPORTANT: Sending childGrade as a string to accommodate "Starter", "Basic", etc.
      // The backend model must be updated to handle this string if necessary.
      childGrade: childForm.childGrade, 
      subject: childForm.subject,
      avatarUrl: childForm.avatarUrl,
    };

    setLoading(true);
    try {
      // (Avatar upload logic remains the same)
      if (customAvatar) {
        const formData = new FormData();
        formData.append("file", customAvatar);

        const uploadRes = await fetch(
          `${API_BASE}/api/children/upload-avatar`,
          { method: "POST", body: formData }
        );

        if (!uploadRes.ok) throw new Error("Avatar upload failed");
        const { url } = await uploadRes.json();
        payload.avatarUrl = url;
      }

      const res = await fetch(`${API_BASE}/api/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save profile");
      }

      const data = await res.json();
      const childData = data.child || data;

      // Navigate to Dashboard
      navigate(
        `/FoundationDashboard/${childData.curriculum}/${encodeURIComponent(childData.subject)}/${childData.childGrade}`
      );

    } catch (error) {
      console.error("❌ Error creating child:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CONDITIONAL LOGIC HELPERS ---

  const isCurriculumLocked = childForm.country !== "" && childForm.country !== "Zambia";

  // Helper to get available subjects based on curriculum
  const getSubjectOptions = () => {
    if (childForm.curriculum === "Cambridge") {
      return ["Reading Program", "Math", "Science"];
    }
    if (childForm.curriculum === "Local") {
      return ["Reading Program", "Math/Science"];
    }
    return [];
  };

  const subjectOptions = getSubjectOptions();
  
  // ✅ NEW: Logic for conditional grade options
  const isReadingProgram = childForm.subject === "Reading Program";
  const gradeOptions = isReadingProgram ? READING_LEVELS : GRADE_OPTIONS;
  
  const gradePlaceholder = isReadingProgram 
      ? "Select Reading Level" 
      : childForm.curriculum === "Cambridge" 
        ? "Select Stage" 
        : "Select Grade";

  return (
    <div
      className={`relative min-h-screen ${BACKGROUND_GRADIENT_CLASS} flex items-center justify-center p-4`}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Setup Your Child 🧑‍🎓
          </h2>
          <p className="text-gray-500">
            Create a profile for the learner to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. NAME */}
          <div className="relative">
            <Smile className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="childName"
              placeholder="Child's Full Name"
              value={childForm.childName}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 2. COUNTRY DROPDOWN */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <select
              name="country"
              value={childForm.country}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="" disabled>Select Country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 3. CURRICULUM DROPDOWN */}
          <div className="relative">
            <Globe className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <select
              name="curriculum"
              value={childForm.curriculum}
              onChange={handleChange}
              required
              disabled={!childForm.country || isCurriculumLocked} 
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white ${
                isCurriculumLocked ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
            >
              <option value="" disabled>Select Curriculum</option>
              <option value="Local">Local (Zambian)</option>
              <option value="Cambridge">Cambridge</option>
            </select>
          </div>

          {/* 4. SUBJECT DROPDOWN (MOVED HERE) */}
          <div className="relative">
            <Layers className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <select
              name="subject"
              value={childForm.subject}
              onChange={handleChange}
              required
              disabled={!childForm.curriculum}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100"
            >
              <option value="" disabled>Select Subject</option>
              {subjectOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* 5. GRADE / STAGE / LEVEL DROPDOWN (Conditional) */}
          <div className="relative">
            <Book className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <select
              name="childGrade"
              value={childForm.childGrade}
              onChange={handleChange}
              required
              disabled={!childForm.subject} // Disabled until subject is chosen
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100"
            >
              <option value="" disabled>
                {gradePlaceholder}
              </option>
              {gradeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {/* If not reading, add "Stage" or "Grade" prefix */}
                  {isReadingProgram 
                    ? opt 
                    : (childForm.curriculum === "Cambridge" ? `Stage ${opt}` : `Grade ${opt}`)}
                </option>
              ))}
            </select>
          </div>

          {/* AVATAR SELECTION (Remains the same) */}
          <div className="pt-2">
            <p className="text-gray-600 mb-2 font-medium">Choose an Avatar 👇</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {DEFAULT_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`rounded-full border-2 p-1 transition-all duration-200 ${
                    childForm.avatarUrl === avatar
                      ? "border-purple-600 scale-110"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                </button>
              ))}
            </div>

            <div className="mt-4 text-center">
              <label
                htmlFor="avatarUpload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 transition-all"
              >
                <ImageIcon className="h-4 w-4" />
                Upload Custom Avatar
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {childForm.avatarUrl && (
              <div className="mt-4 flex justify-center">
                <img
                  src={childForm.avatarUrl}
                  alt="Selected Avatar"
                  className="w-20 h-20 rounded-full border-4 border-purple-500 shadow-md"
                />
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-[1.01] bg-purple-600 hover:bg-purple-700 shadow-md ${
              loading ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Profile..." : "Complete Setup & Start Learning"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChildSetup;