import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Store, MapPin, Phone, Hash, Save, Edit3, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingScreen from './LoadingScreen'

const DairyDetails = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [exists, setExists] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    pincode: '',
    phone: ''
  });

  // 1. Fetch existing details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "dairyDetails", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setFormData(docSnap.data());
          setExists(true);
          setIsEditing(false); 
        } else {
          setExists(false);
          setIsEditing(true); 
        }
      } catch (err) {
        toast.error("Failed to load dairy details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [user?.uid]);

  // 2. Save/Update details
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.isReadOnly) {
      toast.error("Read-only access: Cannot save changes");
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, "dairyDetails", user.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setExists(true);
      setIsEditing(false);
      toast.success("Dairy details saved successfully!");
    } catch (err) {
      toast.error("Error saving: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Fetching Profile" />;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-50/50 overflow-hidden">
        
        <div className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Dairy Information</h2>
            <p className="text-blue-100 text-sm font-medium">Manage your business profile for reports</p>
          </div>
          <Store size={40} className="opacity-20" />
        </div>

        <div className="p-10">
          {!isEditing ? (
            /* --- VIEW MODE --- */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dairy Name</p>
                  <p className="text-xl font-bold text-gray-800">{formData.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-xl font-bold text-gray-800">{formData.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                  <p className="text-xl font-bold text-gray-800">{formData.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pincode</p>
                  <p className="text-xl font-bold text-gray-800">{formData.pincode}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                <Edit3 size={18} /> Edit Details
              </button>
            </div>
          ) : (
            /* --- EDIT/ADD MODE --- */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Dairy Name</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="tel"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Full Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Pincode</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.pincode}
                      onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  disabled={user?.isReadOnly}
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Save size={20} /> {exists ? 'Update Details' : 'Add Dairy Details'}
                </button>
                {exists && (
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DairyDetails;