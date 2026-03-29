import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Clock, Lock } from 'lucide-react';

const SubscriptionWrapper = ({ children }) => {
  const { user } = useAuth();
  const [subData, setSubData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(""); // State for the HH:MM:SS string

  useEffect(() => {
    if (!user?.uid) return;

    const fetchSub = async () => {
      const docRef = doc(db, "subscriptions", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const expiry = new Date(data.expiryDate);
        expiry.setHours(23, 59, 59, 999);

        const updateStatus = () => {
          const today = new Date();
          const diffTime = expiry - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // LOGIC FOR LAST 3 DAYS COUNTDOWN
          if (diffDays > 0 && diffDays <= 3) {
            const h = Math.floor((diffTime / (1000 * 60 * 60)));
            const m = Math.floor((diffTime / (1000 * 60)) % 60);
            const s = Math.floor((diffTime / 1000) % 60);
            setTimeLeft(`${h}h ${m}m ${s}s`);
          }

          setSubData({
            expiryDate: data.expiryDate,
            daysLeft: diffDays,
            isExpired: diffTime <= 0,
            showWarning: diffDays <= 30 && diffTime > 0
          });
        };

        updateStatus();
        // Update the clock every second
        const timer = setInterval(updateStatus, 1000);
        return () => clearInterval(timer);
      }
    };

    fetchSub();
  }, [user?.uid]);

  if (subData?.isExpired) {
    return (
      <div className="no-print h-screen w-full bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-red-50 p-8 rounded-[3rem] mb-6">
          <Lock size={80} className="text-red-500" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Service Suspended</h1>
        <p className="text-gray-500 mt-4 max-w-sm font-bold">
          Your annual subscription expired on {subData.expiryDate.split('-').reverse().join('-')}. 
          Please contact support to renew.
        </p>
      </div>
    );
  }

  return (
    <>
      {subData?.showWarning && (
        <div className="fixed top-0 left-0 w-full z-[9999] bg-orange-500 text-white py-2 px-4 shadow-lg flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <Clock size={16} className="animate-pulse" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">
              {/* SWITCH BETWEEN DAYS AND TIME HERE */}
              Plan Alert: Your subscription expires in {subData.daysLeft <= 3 ? timeLeft : `${subData.daysLeft} days`}
            </p>
          </div>
          <button className="text-[9px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase">
            Renew Now
          </button>
        </div>
      )}
      
      <div className={subData?.showWarning ? "pt-9" : ""}>
        {children}
      </div>
    </>
  );
};

export default SubscriptionWrapper;