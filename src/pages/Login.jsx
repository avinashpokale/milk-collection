import { useState, useEffect } from "react"; // Added useEffect
import { auth } from "../firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Login() {
  const { user } = useAuth(); // Get user from context
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect automatically when user state is detected
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      if (userCredential.user) {
        toast.success("Welcome Back!");
        // We don't navigate here; the useEffect above will handle it 
        // as soon as AuthContext recognizes the new user.
      }
    } catch (err) {
      toast.error("Login failed. Check your email and password.");
      setLoading(false); // Only reset on error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Sign In</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}