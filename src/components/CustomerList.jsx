import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, UserPlus, Search, User } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingScreen from './LoadingScreen';

const CustomerList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, "customers"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // SORTING: This ensures code 1 is at top, then 2, then 3...
        list.sort((a, b) => Number(a.code) - Number(b.code));
        
        setCustomers(list);
      } catch (err) {
        toast.error("Error loading customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [user?.uid]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      setCustomers(customers.filter(c => c.id !== id));
      toast.success("Customer Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(c.code).includes(searchTerm)
  );

  if (loading) return <LoadingScreen message="Loading Customers..." />;

  return (
    <div className="max-w-5xl mx-auto p-2 md:p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-4 bg-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-xl">
              <User size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight">Customer List</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search name or code..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => navigate('/add-customer')}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
              // className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
            >
              <UserPlus size={20} /> Add Customer
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Code</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Name</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</th>
                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                  {/* Code Column - Styled as a badge */}
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                      {customer.code}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <p className="font-bold text-slate-800 text-sm">{customer.name}</p>
                  </td>

                  <td className="p-4">
                    <p className="text-xs text-slate-500 italic">{customer.address || '---'}</p>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/edit-customer/${customer.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        disabled={user?.isReadOnly}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
            <div className="p-20 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerList;