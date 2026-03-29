import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Edit2, Trash2, Search, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const CollectionList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getToday = () => new Date().toISOString().split('T')[0];
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [searchTerm, setSearchTerm] = useState('');
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  // 1. Fetch Customers (Uses swapped user.uid from AuthContext)
  useEffect(() => {
    if (!user?.uid) return;
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, "customers"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        toast.error("Failed to load customers");
      }
    };
    fetchCustomers();
  }, [user?.uid]);

  // 2. Fetch Daily Collections (Uses swapped user.uid from AuthContext)
  useEffect(() => {
    if (!user?.uid) return;
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "dailyCollections"),
          where("userId", "==", user.uid),
          where("date", "==", selectedDate),
          orderBy("createdAt", "asc")
        );
        const snap = await getDocs(q);
        setCollections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.log(err)
        toast.error("Failed to load collections");
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [user?.uid, selectedDate]);

  // Helper: Find customer details for the list
  const getCustomerData = (item) => {
    if (item.customerId) {
      return customers.find(c => c.id === item.customerId) || null;
    }
    return customers.find(c => String(c.code) === String(item.code)) || null;
  };

  // Filter logic for search bar
  const filteredCollections = collections.filter(item => {
    const customer = getCustomerData(item);
    const name = customer ? customer.name.toLowerCase() : "unknown";
    const code = String(item.code).toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || code.includes(search);
  });

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (user?.isReadOnly) {
      toast.error("Read-only access: Cannot delete records");
      return;
    }

    try {
      await deleteDoc(doc(db, "dailyCollections", deleteId));
      setCollections(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
      toast.success("Entry deleted successfully");
    } catch (err) {
      toast.error("Error deleting record");
    }
  };

  const totals = filteredCollections.reduce((acc, curr) => ({
    qty: acc.qty + parseFloat(curr.qty || 0),
    amount: acc.amount + parseFloat(curr.amount || 0)
  }), { qty: 0, amount: 0 });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 relative">
      
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800">Delete Entry?</h3>
              <p className="text-gray-500 text-sm">This action cannot be undone.</p>
              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Daily Logs</h1>
          <p className="text-sm text-gray-400 font-medium tracking-wide">
            Records for {selectedDate.split('-').reverse().join('-')}
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex-1 md:flex-none min-w-[150px]">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Qty</p>
            <p className="text-2xl font-black text-gray-800">{totals.qty.toFixed(2)} <span className="text-xs font-normal">Ltr</span></p>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex-1 md:flex-none min-w-[150px]">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Amount</p>
            <p className="text-2xl font-black text-gray-800">₹{totals.amount.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Search & Date Controls */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-5 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by name or code..."
            className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full">
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        <div className="lg:col-span-4 flex bg-gray-100 p-1.5 rounded-2xl">
          <button onClick={() => setSelectedDate(getToday())} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedDate === getToday() ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Today</button>
          <button onClick={() => setSelectedDate(getYesterday())} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedDate === getYesterday() ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Yesterday</button>
        </div>

        <div className="lg:col-span-3 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none" />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sr.No</th>
                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quality</th>
                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</th>
                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-24 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">No Records Found</td>
                </tr>
              ) : (
                filteredCollections.map((item,index) => {
                  const customer = getCustomerData(item);
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-0 text-center">
                        <div className="flex items-center justify-center">
                          <span className="w-6 h-6 flex items-center justify-centertext-[10px] font-black text-gray-800">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Badge Style Code */}
                          <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-pink-100 text-pink-700 font-black text-xs border border-pink-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
                            {item.code}
                          </span>
                          
                          {/* Name and secondary info */}
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
                              {customer?.name || "Unknown"}
                            </span>
                            {/* Optional: Add phone or small detail below the name if needed */}
                            {customer?.phone && (
                              <span className="text-[9px] text-gray-400 font-bold uppercase">
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex gap-1.5">
                          <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black">F {item.fat}</span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">S {item.snf}</span>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-bold text-gray-700">{item.qty} Ltr</td>
                      <td className="p-6 text-sm font-black text-emerald-600">₹{item.amount}</td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/edit-collection/${item.id}`)} className="p-2 bg-white border border-gray-100 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm transition-all"><Edit2 size={15} /></button>
                          <button disabled={user?.isReadOnly} onClick={() => setDeleteId(item.id)} className="p-2 bg-white border border-gray-100 text-red-400 hover:bg-red-500 hover:text-white rounded-xl shadow-sm disabled:opacity-20 transition-all"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectionList;