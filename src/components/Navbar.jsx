import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react'; 
import { toast } from 'react-toastify';


const Navbar = ({ onMenuClick }) => { 
  // Destructure dairyDetails from useAuth
  const { user, dairyDetails } = useAuth();
  const navigate = useNavigate();

  // Extract username from email before the @ sign
  const userName = user?.email ? user.email.split('@')[0] : "";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-[100] no-print">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 md:h-20 items-center">
          
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
            >
              <Menu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-4 group">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105 hidden md:block" 
              />
              
              <div className="h-8 w-[1px] bg-gray-200 hidden lg:block"></div>

              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-black leading-none">
                  {/* Using dairyDetails from AuthContext instead of local state */}
                  {dairyDetails?.name || "Milk DAIRY"}
                </h1>
                <p className="text-[8px] md:text-[9px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">
                  Management System
                </p>
              </div>
            </Link>
          </div>

          {user?.isReadOnly && (
            <div className="flex items-center bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-2">👁️</span>
              Read Only Access
            </div>
          )}

          {/* RIGHT SIDE: USERNAME & LOGOUT */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-r border-gray-100 pr-4">
              {userName}
            </span>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-100 active:scale-95"
            >
              <span>Logout</span>
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;