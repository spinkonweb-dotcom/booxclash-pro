import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Lock, ArrowRight, Loader2, 
  GraduationCap, Briefcase 
} from 'lucide-react';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, // Required for manual signup
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
// Make sure this path points to your actual firebase config file
import { auth, googleProvider, db } from './firebase'; 

export default function Signup() {
  const [isLoading, setIsLoading] = useState(true); 
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // --- 1. CHECK FOR EXISTING SESSION ON LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Found existing session:", user.email);
        
        // Check local storage first (faster)
        const localRole = localStorage.getItem('boox_user_role');
        
        if (localRole) {
          handleRedirection(localRole);
        } else {
          // Fallback to Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const dbRole = userSnap.data().role;
            handleRedirection(dbRole);
          }
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe(); 
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. THIS IS THE FIXED MANUAL SIGNUP FUNCTION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop page refresh
    setIsLoading(true);

    try {
      // A. Create the User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // B. Update the "Display Name" in Firebase Auth immediately
      if (formData.name) {
        await updateProfile(user, {
          displayName: formData.name
        });
      }

      // C. Save full details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone, // Saving the phone number here
        role: role, 
        createdAt: serverTimestamp(),
        authProvider: "email"
      });

      // D. Redirect
      handleRedirection(role);

    } catch (error: any) {
      console.error("Signup Error:", error);
      let msg = "Failed to create account.";
      if (error.code === 'auth/email-already-in-use') msg = "That email is already registered.";
      if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      alert(msg); // Only actual errors trigger alerts now
      setIsLoading(false);
    }
  };

  // --- 3. GOOGLE LOGIN LOGIC ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      let targetRole = role; 

      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: role, 
          createdAt: serverTimestamp(),
          authProvider: "google"
        });
      } else {
        const userData = userSnap.data();
        targetRole = userData.role; 
      }

      handleRedirection(targetRole);

    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Login failed: " + error.message);
      setIsLoading(false);
    }
  };

  // --- 4. REDIRECTION & STORAGE ---
  const handleRedirection = (userRole: string) => {
    localStorage.setItem('boox_user_role', userRole);
    localStorage.setItem('boox_session_active', 'true');

    if (userRole === 'teacher') {
      window.location.href = '/teacher-dashboard'; 
    } else {
      window.location.href = '/student-portal'; 
    }
  };

  // Styles
  const theme = role === 'teacher' 
    ? { color: 'emerald', bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', ring: 'focus:ring-emerald-500' }
    : { color: 'blue', bg: 'bg-blue-600', hover: 'hover:bg-blue-500', ring: 'focus:ring-blue-500' };

  if (isLoading && !auth.currentUser) {
     return (
       <div className="min-h-screen bg-slate-950 flex items-center justify-center">
         <div className="text-center">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10 mx-auto mb-4" />
            <p className="text-slate-400">Checking session...</p>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2 transition-colors duration-500 ${role === 'teacher' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              BooxClash <span className={`${role === 'teacher' ? 'text-emerald-500' : 'text-blue-500'} transition-colors`}>Pro</span>
            </h1>
            <p className="text-slate-400">Create your account to get started</p>
          </div>

          {/* Role Toggle */}
          <div className="bg-slate-950 p-1.5 rounded-xl flex mb-8 border border-slate-800">
            <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${role === 'student' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <GraduationCap size={18} /> Student
            </button>
            <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${role === 'teacher' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <Briefcase size={18} /> Teacher
            </button>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
              <input name="name" required type="text" placeholder="Full Name" onChange={handleChange} className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-opacity-100 transition-all focus:border-${theme.color}-500`} />
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
              <input name="email" required type="email" placeholder="Email Address" onChange={handleChange} className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-opacity-100 transition-all focus:border-${theme.color}-500`} />
            </div>

            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
              <input name="phone" required type="tel" placeholder="Phone Number" onChange={handleChange} className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-opacity-100 transition-all focus:border-${theme.color}-500`} />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
              <input name="password" required type="password" placeholder="Create Password" onChange={handleChange} className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-opacity-100 transition-all focus:border-${theme.color}-500`} />
            </div>

            <button type="submit" disabled={isLoading} className={`w-full py-4 mt-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${theme.bg} ${theme.hover} disabled:opacity-50 disabled:cursor-not-allowed`}>
              Sign Up as {role === 'teacher' ? 'Teacher' : 'Student'} <ArrowRight size={20} />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Or continue with</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Google Button */}
          <button onClick={handleGoogleLogin} disabled={isLoading} type="button" className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors active:scale-95 disabled:opacity-70">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? "Connecting..." : "Google"}
          </button>

          <p className="text-center text-slate-500 mt-8 text-sm">
            Already have an account?{' '}
            <a href="/schemes" className={`font-bold hover:underline ${role === 'teacher' ? 'text-emerald-500' : 'text-blue-500'}`}>
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}