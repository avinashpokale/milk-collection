import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, WifiOff, SignalHigh, SignalMedium, SignalLow, Globe } from 'lucide-react';

const LoadingScreen = ({ message = "Syncing Data", fullScreen = false }) => {
  const [showRetry, setShowRetry] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ quality: 'Checking...', isOnline: true });

  useEffect(() => {
    const checkInternet = async () => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const baseQuality = conn ? conn.effectiveType.toUpperCase() : 'CONNECTED';

      // Actual Internet Ping Check
      try {
        // We fetch a tiny resource with a cache-buster to check real internet access
        const response = await fetch("https://www.google.com/favicon.ico", { 
          mode: 'no-cors', 
          cache: 'no-store' 
        });
        if (response) {
          setNetworkStatus({ quality: baseQuality, isOnline: true });
        }
      } catch (e) {
        // Wi-Fi is on, but ping to Google failed
        setNetworkStatus({ quality: 'NO INTERNET', isOnline: false });
      }
    };

    checkInternet();
    const interval = setInterval(checkInternet, 5000); // Re-check every 5s

    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const getSignalIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff size={12} className="text-red-500" />;
    if (['4G', 'CONNECTED'].includes(networkStatus.quality)) return <SignalHigh size={12} className="text-emerald-500" />;
    return <SignalLow size={12} className="text-orange-500" />;
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center p-6" 
    : "flex min-h-[60vh] w-full flex-col items-center justify-center p-6";

  return (
    <div className={containerClasses}>
      {!showRetry ? (
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-20 h-20 border-4 border-blue-50 rounded-full"></div>
            <Loader2 className="animate-spin text-blue-600 z-10" size={80} strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 animate-pulse">
              {message}
            </p>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${!networkStatus.isOnline ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              {getSignalIcon()}
              <span className={`text-[9px] font-black uppercase tracking-widest ${!networkStatus.isOnline ? 'text-red-500' : 'text-gray-400'}`}>
                {networkStatus.quality}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${!networkStatus.isOnline ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
            {!networkStatus.isOnline ? <Globe size={32} /> : <WifiOff size={32} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">
              {!networkStatus.isOnline ? "No Internet Access" : "Connection Timeout"}
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              {!networkStatus.isOnline ? "Wi-Fi is on, but there's no data flow." : "The server is taking too long to respond."}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg active:scale-95"
          >
            <RefreshCw size={14} />
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;