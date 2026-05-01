import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import LoadingScreen from './LoadingScreen'

const AddCustomer = () => {
  const { user } = useAuth();
  const { id } = useParams(); // Get ID from URL if editing
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: ''
  });

  // Load data if we are in "Edit" mode (Using getDoc for one-time fetch)
  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        setFetching(true);
        try {
          const docRef = doc(db, "customers", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          }
        } catch (error) {
          toast.error("Failed to load customer details");
        } finally {
          setFetching(false);
        }
      };
      fetchCustomer();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        // UPDATE EXISTING
        const docRef = doc(db, "customers", id);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success("Customer updated successfully");
      } else {
        // ADD NEW
        await addDoc(collection(db, "customers"), {
          ...formData,
          userId: user.uid, // Link customer to the logged-in user
          createdAt: serverTimestamp()
        });
        toast.success("Customer added successfully");
      }
      navigate('/customers'); // Redirect to a list page after saving
    } catch (error) {
      toast.error("Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingScreen message="Fetching Profile" />;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {id ? 'Edit Customer' : 'Add New Customer'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Customer Code</label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. CUST-001"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Address</label>
          <textarea
            required
            rows="3"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Street address, City, State"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={loading || user?.isReadOnly}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {id ? 'Update Customer' : 'Save Customer'}
        </button>
      </form>
    </div>
  );
};

export default AddCustomer;