import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute() {
  const { user, loading } = useAuth(); // 1. Pull loading from context

  // 2. If the auth state is still being determined, show a loader
  // This prevents the "bounce-back" to the login page
  
  if (loading) {
    return <LoadingScreen fullScreen message="Verifying Session" />;
    // return (
      // <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[999]">
      //   <div className="relative">
      //     <div className="w-16 h-16 border-4 border-blue-50 rounded-full animate-spin border-t-blue-600"></div>
      //     <img src="/logo.png" className="absolute inset-0 m-auto h-8 w-8 object-contain" alt="loading" />
      //   </div>
      //   <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 animate-pulse">
      //     Synchronizing Data...
      //   </p>
      // </div>
      
    // );
  }

  // 3. Only redirect if loading is finished AND there is no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}