import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  User, 
  ArrowLeft, 
  RefreshCw, 
  Calculator, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingScreen from './LoadingScreen';
import PrintReceipt from './PrintReceipt';


const DailyCollection = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Refs for UI control
  const codeInputRef = useRef(null);
  const timerRef = useRef(null);

  // Data States
  const [customers, setCustomers] = useState([]);
  const [rateSettings, setRateSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // New: Prevent double clicks
  
  // Logic States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [breakdown, setBreakdown] = useState({ fatAdj: 0, snfAdj: 0 });

  const getToday = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    date: getToday(),
    code: '',
    customerId: '',
    qty: '',
    fat: '',
    snf: '',
    rate: 0,
    amount: 0
  });
  const [printData, setPrintData] = useState(null);

  const handlePrint = (data) => {
    setPrintData(data);
    setTimeout(() => {
      window.print();
      setPrintData(null); // Clear it after print dialog closes
    }, 500);
  };

  // 1. Initial Load: Customers, Rates, and Edit Data
  useEffect(() => {
    if (!user?.uid) return;
    const fetchData = async () => {
      try {
        const q = query(collection(db, "customers"), where("userId", "==", user.uid));
        const custSnap = await getDocs(q);
        setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const rateDoc = await getDoc(doc(db, "rates", user.uid));
        if (rateDoc.exists()) setRateSettings(rateDoc.data());

        if (id) {
          const entryDoc = await getDoc(doc(db, "dailyCollections", id));
          if (entryDoc.exists()) setFormData(entryDoc.data());
        } else {
          setTimeout(() => codeInputRef.current?.focus(), 500);
        }
      } catch (err) {
        toast.error("Error loading initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.uid, id]);

  // 2. Uniqueness Check Logic (Background)
  const checkUniqueness = async (currentCode, currentDate) => {
    if (id || !currentCode || !currentDate || !user?.uid) {
      setIsDuplicate(false);
      return;
    }
    try {
      const docId = `${currentDate}_${currentCode}_${user.uid}`;
      const docRef = doc(db, "dailyCollections", docId);
      const docSnap = await getDoc(docRef);
      setIsDuplicate(docSnap.exists());
    } catch (err) {
      console.warn("Background check pending...");
      setIsDuplicate(false);
    }
  };

  // 3. Input Change Handlers
  const handleCodeChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, code: val }));
    setIsDuplicate(false); // Reset warning immediately while typing

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      checkUniqueness(val, formData.date);
    }, 3000); // 3 Second Delay
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, date: val }));
    checkUniqueness(formData.code, val); // Instant check for date change
  };

  // Sync Selected Customer Details
  useEffect(() => {
    const found = customers.find(c => String(c.code) === String(formData.code));
    setSelectedCustomer(found || null);
    if (found && found.id !== formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: found.id }));
    }
  }, [formData.code, customers]);

  // 4. Rate Calculation Logic
  useEffect(() => {
    if (!rateSettings || !formData.fat || !formData.snf) {
      setFormData(prev => ({ ...prev, rate: 0, amount: 0 }));
      setBreakdown({ fatAdj: 0, snfAdj: 0 });
      return;
    }
    const f = parseFloat(formData.fat);
    const s = parseFloat(formData.snf);
    const q = parseFloat(formData.qty) || 0;
    
    let fatAdj = 0, snfAdj = 0;
    const fatSteps = Math.round((f - 3.5) * 10);
    fatAdj = f >= 3.5 ? fatSteps * rateSettings.fatIncrement : fatSteps * rateSettings.fatDecrement;
    if (f < rateSettings.belowFat) fatAdj -= (Math.round((rateSettings.belowFat - f) * 10) * rateSettings.belowFatDecrement);
    
    const snfSteps = Math.round((s - 8.5) * 10);
    snfAdj = s >= 8.5 ? snfSteps * rateSettings.snfIncrement : snfSteps * rateSettings.snfDecrement;
    if (s < rateSettings.belowSnf) snfAdj -= (Math.round((rateSettings.belowSnf - s) * 10) * rateSettings.belowSnfDecrement);
    
    const finalRate = Number(rateSettings.rate) + fatAdj + snfAdj;
    setBreakdown({ fatAdj, snfAdj });
    setFormData(prev => ({ 
      ...prev, 
      rate: finalRate.toFixed(2), 
      amount: (q * finalRate).toFixed(2) 
    }));
  }, [formData.fat, formData.snf, formData.qty, rateSettings]);

  // 5. Submit Handler (With Final Integrity Guard)
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!selectedCustomer || user?.isReadOnly) return;

  //   setSaving(true); // Disable button immediately
  //   const docId = id || `${formData.date}_${formData.code}_${user.uid}`;

  //   try {
  //     // FINAL GUARD: Instant check before setDoc
  //     if (!id) {
  //       const docRef = doc(db, "dailyCollections", docId);
  //       const docSnap = await getDoc(docRef);
  //       if (docSnap.exists()) {
  //         setIsDuplicate(true);
  //         toast.error("Duplicate Entry! This record already exists.");
  //         setSaving(false);
  //         return;
  //       }
  //     }

  //     const finalData = { 
  //       ...formData, 
  //       customerId: selectedCustomer.id, 
  //       userId: user.uid, 
  //       updatedAt: serverTimestamp() 
  //     };
      
  //     if (!id) finalData.createdAt = serverTimestamp();
  //     console.log(finalData)
      
  //     await setDoc(doc(db, "dailyCollections", docId), finalData, { merge: true });
  //     toast.success(id ? "Entry Updated" : "Entry Saved");
      
  //     if (!id) {
  //       setFormData({ ...formData, code: '', qty: '', fat: '', snf: '', rate: 0, amount: 0 });
  //       setIsDuplicate(false);
  //       if (timerRef.current) clearTimeout(timerRef.current);
  //       codeInputRef.current?.focus();
  //     } else {
  //       navigate('/collection-list');
  //     }
  //   } catch (err) {
  //     toast.error("Error: " + err.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Validation
    if (!selectedCustomer || user?.isReadOnly) return;

    setSaving(true);

    // 2. Define the Unique Document ID
    const docId = id || `${formData.date}_${formData.code}_${user.uid}`;

    try {
      const docRef = doc(db, "dailyCollections", docId);

      // 3. THE INSTANT GUARD (For New Records)
      if (!id) {
        try {
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setIsDuplicate(true);
            toast.error("Stop! Entry for this Date and Code already exists.");
            setSaving(false);
            return; // BLOCKS THE SAVE IMMEDIATELY
          }
        } catch (checkError) {
          // If permission is denied on the check, we proceed to attempt the save
          // since the record likely doesn't exist yet.
        }
      }

      // 4. Prepare Final Data Object
      const finalData = { 
        ...formData, 
        customerId: selectedCustomer.id, 
        userId: user.uid, 
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp() 
      };

     // 5. Perform the Actual Write
      await setDoc(docRef, finalData, { merge: true });
      toast.success(id ? "Entry Updated" : "Entry Saved");

      // --- UPDATED PRINT & NAVIGATION LOGIC ---
      const confirmPrint = window.confirm("Print receipt?");
      
      if (confirmPrint) {
        handlePrint({ ...finalData, customerName: selectedCustomer.name });
        
        // If editing, wait for print dialog to finish before navigating
        if (id) {
          setTimeout(() => {
            navigate('/collection-list');
          }, 2000); // Give enough time for the print handoff
          return; // Stop here so it doesn't navigate immediately below
        }
      }

      // 6. Reset Form (For New Entry) or Navigate (For Edit if print was cancelled)
      if (!id) {
        setFormData({ 
          ...formData, 
          code: '', 
          qty: '', 
          fat: '', 
          snf: '', 
          rate: 0, 
          amount: 0 
        });
        setIsDuplicate(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        setTimeout(() => codeInputRef.current?.focus(), 100);
      } else {
        // This only runs if they clicked 'Cancel' on the print prompt while editing
        navigate('/collection-list');
      }

    } catch (err) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Initializing..." />;

  return (
    <div className="max-w-4xl mx-auto p-1 md:p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-tight">{id ? 'Edit Entry' : 'New Entry'}</h2>
          </div>

          {/* BIG RED BADGE */}
          {isDuplicate && !id && (
            <div className="flex items-center gap-2 bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg animate-bounce shadow-sm">
              <AlertCircle size={14} className="text-red-600" />
              <span className="text-[11px] text-red-600 font-black uppercase tracking-wider">
                Entry Already Exist
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="col-span-2 space-y-0.5">
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Date</label>
              <input 
                type="date" 
                required 
                className="w-full p-2 bg-gray-50 border rounded-lg text-sm" 
                value={formData.date} 
                onChange={handleDateChange} 
              />
            </div>

            <div className="col-span-2 space-y-0.5">
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Customer Name</label>
              <div className={`w-full p-2 border rounded-lg text-sm font-bold flex items-center gap-2 ${selectedCustomer ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-red-50 border-red-100 text-red-500'}`}>
                <User size={14} />
                <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Invalid Code'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Code</label>
              <input 
                ref={codeInputRef} 
                type="number" 
                required 
                className="w-full p-2 bg-gray-50 border rounded-lg text-sm font-bold" 
                value={formData.code} 
                onChange={handleCodeChange} 
                placeholder="00" 
              />
            </div>
            
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Qty (Ltr)</label>
              <input type="number" step="0.01" required className="w-full p-2 bg-gray-50 border rounded-lg text-sm" value={formData.qty} onChange={(e) => setFormData({...formData, qty: e.target.value})} placeholder="0.0" />
            </div>
            
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-orange-600 uppercase ml-1">Fat %</label>
              <input type="number" step="0.1" required className="w-full p-2 bg-orange-50 border-orange-100 rounded-lg text-sm font-bold" value={formData.fat} onChange={(e) => setFormData({...formData, fat: e.target.value})} placeholder="0.0" />
            </div>
            
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-purple-600 uppercase ml-1">SNF %</label>
              <input type="number" step="0.1" required className="w-full p-2 bg-purple-50 border-purple-100 rounded-lg text-sm font-bold" value={formData.snf} onChange={(e) => setFormData({...formData, snf: e.target.value})} placeholder="0.0" />
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="text-center">
              <p className="text-[8px] text-gray-400 uppercase">Fat Adj</p>
              <p className={`text-xs font-bold ${breakdown.fatAdj >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {breakdown.fatAdj >= 0 ? '+' : ''}{breakdown.fatAdj.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-gray-400 uppercase">SNF Adj</p>
              <p className={`text-xs font-bold ${breakdown.snfAdj >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {breakdown.snfAdj >= 0 ? '+' : ''}{breakdown.snfAdj.toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg text-white flex flex-col items-center justify-center p-1">
              <p className="text-[8px] opacity-70 uppercase">Rate</p>
              <p className="text-sm font-black">₹{formData.rate}</p>
            </div>
          </div>

          {/* Final Amount & Submit */}
          <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex flex-col">
              <p className="text-[8px] font-bold text-emerald-800 uppercase">Total Payable</p>
              <p className="text-xl font-black text-emerald-900 tracking-tight">₹{formData.amount}</p>
            </div>
            <button 
              type="submit" 
              disabled={!selectedCustomer || (isDuplicate && !id) || user?.isReadOnly || saving} 
              className="flex-1 max-w-[150px] py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md active:scale-95 disabled:bg-gray-300 text-xs flex items-center justify-center gap-2">
              {saving ? (
                <Loader2 className="animate-spin" size={14} />
              ) : id ? (
                <RefreshCw size={14} />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Verifying...' : id ? 'Update' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
      <PrintReceipt data={printData} />
    </div>
    
  );
};

export default DailyCollection;