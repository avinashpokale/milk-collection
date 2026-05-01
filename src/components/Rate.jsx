import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Edit3, Save, X, Trash2, AlertTriangle, Droplets, FlaskConical, ArrowDownCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingScreen from './LoadingScreen'


const Rate = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    rate: '',
    fatIncrement: '',
    fatDecrement: '',
    belowFat: '',
    belowFatDecrement: '',
    snfIncrement: '',
    snfDecrement: '',
    belowSnf: '',
    belowSnfDecrement: ''
  });

  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchRates = async () => {
      try {
        const docRef = doc(db, "rates", user.uid);
        const docSnap = await getDoc(docRef); // Changed to getDoc
        
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          setData(firestoreData);
          setFormData(firestoreData);
        } else {
          setData(null);
          setFormData({ 
            rate: '', fatIncrement: '', fatDecrement: '', 
            belowFat: '', belowFatDecrement: '', 
            snfIncrement: '', snfDecrement: '', 
            belowSnf: '', belowSnfDecrement: '' 
          });
        }
      } catch (error) {
        toast.error("Error fetching rates");
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [user?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (user?.isReadOnly || !user?.uid) return;

    try {
      const docRef = doc(db, "rates", user.uid);
      const payload = {
        rate: Number(formData.rate),
        fatIncrement: Number(formData.fatIncrement),
        fatDecrement: Number(formData.fatDecrement),
        belowFat: Number(formData.belowFat),
        belowFatDecrement: Number(formData.belowFatDecrement),
        snfIncrement: Number(formData.snfIncrement),
        snfDecrement: Number(formData.snfDecrement),
        belowSnf: Number(formData.belowSnf),
        belowSnfDecrement: Number(formData.belowSnfDecrement),
        updatedAt: new Date()
      };
      
      await setDoc(docRef, payload, { merge: true });
      setData(payload);
      setIsEditing(false);
      toast.success("Rates updated successfully");
    } catch (error) {
      toast.error("Error saving: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (user?.isReadOnly) return;
    try {
      await deleteDoc(doc(db, "rates", user.uid));
      setData(null);
      setShowDeleteConfirm(false);
      toast.success("Rates deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  if (loading) return <LoadingScreen message="Loading Rates" />;

  return (
    <div className="max-w-md mx-auto mt-8 relative pb-10">
      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-red-100">
           <AlertTriangle size={48} className="text-red-500 mb-2" />
           <p className="font-bold text-gray-800">Delete configuration?</p>
           <p className="text-xs text-gray-500 mb-4">This will reset all milk rate calculations.</p>
           <div className="flex gap-2 w-full">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-100 py-2 rounded-lg font-bold">Cancel</button>
           </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <h2 className="font-semibold text-lg">Rate Configuration</h2>
          {data && !isEditing && (
            <button 
              disabled={user?.isReadOnly}
              onClick={() => setShowDeleteConfirm(true)} 
              className="p-2 hover:bg-red-500/20 rounded-full text-red-400 disabled:opacity-30"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="p-6">
          {data && !isEditing ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Standard Rate</p>
                <p className="text-4xl font-bold text-blue-900">₹ {data.rate}</p>
              </div>

              {/* Fat View */}
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                <div className="flex items-center gap-2 text-orange-700 font-bold uppercase text-xs border-b border-orange-200 pb-1">
                  <Droplets size={14} /> Fat Adjustments
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div><p className="text-[10px] text-gray-500 uppercase">Increment</p><p className="font-bold text-green-600">+{data.fatIncrement}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase">Decrement</p><p className="font-bold text-red-600">-{data.fatDecrement}</p></div>
                </div>
                <div className="pt-2 border-t border-orange-100 flex justify-between items-center text-xs">
                  <span className="text-orange-800 font-medium">Below {data.belowFat}% Fat:</span>
                  <span className="font-bold text-red-700">-{data.belowFatDecrement} / 0.1</span>
                </div>
              </div>

              {/* SNF View */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs border-b border-purple-200 pb-1">
                  <FlaskConical size={14} /> SNF Adjustments
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div><p className="text-[10px] text-gray-500 uppercase">Increment</p><p className="font-bold text-green-600">+{data.snfIncrement}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase">Decrement</p><p className="font-bold text-red-600">-{data.snfDecrement}</p></div>
                </div>
                <div className="pt-2 border-t border-purple-100 flex justify-between items-center text-xs">
                  <span className="text-purple-800 font-medium">Below {data.belowSnf}% SNF:</span>
                  <span className="font-bold text-red-700">-{data.belowSnfDecrement} / 0.1</span>
                </div>
              </div>

              <button 
                onClick={() => setIsEditing(true)} 
                className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700"
              >
                 Edit Rate Configuration
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Standard Rate (₹)</label>
                <input required type="number" step="0.01" className="w-full px-4 py-2 border rounded-lg" value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} />
              </div>

              {/* Fat Section */}
              <div className="p-4 border border-orange-200 rounded-xl bg-orange-50/30 space-y-3">
                <p className="text-xs font-black text-orange-600 uppercase">Fat Logic</p>
                <div className="grid grid-cols-2 gap-3">
                   <div><label className="text-[10px] font-bold">Increment (+)</label><input required type="number" step="0.01" className="w-full p-2 border rounded" value={formData.fatIncrement} onChange={(e) => setFormData({...formData, fatIncrement: e.target.value})} /></div>
                   <div><label className="text-[10px] font-bold">Decrement (-)</label><input required type="number" step="0.01" className="w-full p-2 border rounded" value={formData.fatDecrement} onChange={(e) => setFormData({...formData, fatDecrement: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-200">
                   <div><label className="text-[10px] font-bold text-red-600">Below Fat %</label><input required type="number" step="0.1" className="w-full p-2 border border-red-200 rounded bg-red-50" value={formData.belowFat} onChange={(e) => setFormData({...formData, belowFat: e.target.value})} /></div>
                   <div><label className="text-[10px] font-bold text-red-600">Below Fat Dec (-)</label><input required type="number" step="0.01" className="w-full p-2 border border-red-200 rounded bg-red-50" value={formData.belowFatDecrement} onChange={(e) => setFormData({...formData, belowFatDecrement: e.target.value})} /></div>
                </div>
              </div>

              {/* SNF Section */}
              <div className="p-4 border border-purple-200 rounded-xl bg-purple-50/30 space-y-3">
                <p className="text-xs font-black text-purple-600 uppercase">SNF Logic</p>
                <div className="grid grid-cols-2 gap-3">
                   <div><label className="text-[10px] font-bold">Increment (+)</label><input required type="number" step="0.01" className="w-full p-2 border rounded" value={formData.snfIncrement} onChange={(e) => setFormData({...formData, snfIncrement: e.target.value})} /></div>
                   <div><label className="text-[10px] font-bold">Decrement (-)</label><input required type="number" step="0.01" className="w-full p-2 border rounded" value={formData.snfDecrement} onChange={(e) => setFormData({...formData, snfDecrement: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200">
                   <div><label className="text-[10px] font-bold text-red-600">Below SNF %</label><input required type="number" step="0.1" className="w-full p-2 border border-red-200 rounded bg-red-50" value={formData.belowSnf} onChange={(e) => setFormData({...formData, belowSnf: e.target.value})} /></div>
                   <div><label className="text-[10px] font-bold text-red-600">Below SNF Dec (-)</label><input required type="number" step="0.01" className="w-full p-2 border border-red-200 rounded bg-red-50" value={formData.belowSnfDecrement} onChange={(e) => setFormData({...formData, belowSnfDecrement: e.target.value})} /></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={user?.isReadOnly}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save Rates
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-3 border rounded-xl hover:bg-gray-50"><X size={18} /></button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rate;