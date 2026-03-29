import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, startAt, endAt } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import LoadingScreen from '../components/LoadingScreen'
import { 
  Users, 
  Droplets, 
  TrendingUp, 
  History, 
  ArrowUpRight, 
  Search,
  FlaskConical,
  Zap,
  RefreshCw,
  CalendarDays 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [rateData, setRateData] = useState(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [monthlyCollections, setMonthlyCollections] = useState([]);
  const [stats, setStats] = useState({
    todayMilk: 0,
    todayRevenue: 0,
    avgFat: 0,
    todayEntries: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showFullLoader = true) => {
    if (!user?.uid) return;
    if (showFullLoader) setLoading(true);
    setIsRefreshing(true);

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentYearMonth = today.substring(0, 7); // e.g., "2026-03"

      // 1. Get Rate & Customers
      const rateRef = doc(db, "rates", user.uid);
      const rateSnap = await getDoc(rateRef);
      if (rateSnap.exists()) setRateData(rateSnap.data());

      const custSnap = await getDocs(query(collection(db, "customers"), where("userId", "==", user.uid)));
      setRegisteredCount(custSnap.size);
      setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 2. Get MONTHLY Data for the Comparison Table
      const monthlySnap = await getDocs(query(
        collection(db, "dailyCollections"),
        where("userId", "==", user.uid),
        where("date", ">=", `${currentYearMonth}-01`),
        where("date", "<=", `${currentYearMonth}-31`)
      ));
      const monthlyData = monthlySnap.docs.map(doc => doc.data());
      setMonthlyCollections(monthlyData);

      // 3. Today's Stats
      let milk = 0, revenue = 0, fatSum = 0, todayCount = 0;
      monthlyData.forEach(data => {
        if (data.date === today) {
          milk += parseFloat(data.qty || 0);
          revenue += parseFloat(data.amount || 0);
          fatSum += parseFloat(data.fat || 0);
          todayCount++;
        }
      });

      setStats({
        todayMilk: milk.toFixed(1),
        todayRevenue: revenue.toFixed(0),
        avgFat: todayCount > 0 ? (fatSum / todayCount).toFixed(1) : 0,
        todayEntries: todayCount
      });

      // 4. Recent Logs
      const recentSnap = await getDocs(query(
        collection(db, "dailyCollections"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        limit(5)
      ));
      setRecentLogs(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      if (!showFullLoader) toast.success("Dashboard Updated");
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCustomerName = (code) => {
    const found = customers.find(c => c.code === code);
    return found ? found.name : "Unknown";
  };

  // --- LOGIC FOR THE 10-DAY COMPARISON TABLE ---
  const getThreePeriodData = () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      p1: { day: i + 1, qty: 0, amt: 0 },
      p2: { day: i + 11, qty: 0, amt: 0 },
      p3: { day: i + 21, qty: 0, amt: 0 },
    }));

    let totals = { 
        p1: { qty: 0, amt: 0 }, 
        p2: { qty: 0, amt: 0 }, 
        p3: { qty: 0, amt: 0 } 
    };

    monthlyCollections.forEach((item) => {
      const d = new Date(item.date).getDate();
      const qty = parseFloat(item.qty || 0);
      const amt = parseFloat(item.amount || 0);

      if (d <= 10) {
        rows[d - 1].p1.qty += qty; rows[d - 1].p1.amt += amt;
        totals.p1.qty += qty; totals.p1.amt += amt;
      } else if (d <= 20) {
        rows[d - 11].p2.qty += qty; rows[d - 11].p2.amt += amt;
        totals.p2.qty += qty; totals.p2.amt += amt;
      } else if (d <= 31 && (d-21) < 11) {
        // Handle 31st day by adding to the 10th row of p3 if necessary or creating 11th row
        const index = d - 21;
        if(index < 10) {
            rows[index].p3.qty += qty; rows[index].p3.amt += amt;
        } else if (index === 10) {
            // Special case for 31st
            if(!rows[10]) rows.push({ p1: {day:'', qty:0, amt:0}, p2: {day:'', qty:0, amt:0}, p3: {day:31, qty:0, amt:0} });
            rows[10].p3.qty += qty; rows[10].p3.amt += amt;
        }
        totals.p3.qty += qty; totals.p3.amt += amt;
      }
    });
    return { rows, totals };
  };

  const { rows, totals } = getThreePeriodData();

  if (loading) return <LoadingScreen message="Loading..." />;

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      
      {/* 1. RATE CARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ... (Your existing Rate Card Code) ... */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-5 md:p-6 border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
               <Zap size={12} className="text-indigo-500 fill-indigo-500" />
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Base Rate (3.5/8.5)</span>
            </div>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-5xl font-black text-slate-900">₹{rateData?.rate || '0'}</span>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Per Ltr</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto z-10">
            <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100">
              <p className="text-[9px] text-orange-600 font-black uppercase flex items-center gap-1 mb-2"><Droplets size={12}/> Fat</p>
              <div className="flex justify-between items-center gap-4 text-xs">
                <div className="text-center"><p className="text-[8px] text-gray-400 uppercase font-bold">Inc</p><p className="font-black text-green-600">+{rateData?.fatIncrement || 0}</p></div>
                <div className="text-center"><p className="text-[8px] text-gray-400 uppercase font-bold">Dec</p><p className="font-black text-red-500">-{rateData?.fatDecrement || 0}</p></div>
              </div>
            </div>
            <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
              <p className="text-[9px] text-purple-600 font-black uppercase flex items-center gap-1 mb-2"><FlaskConical size={12}/> SNF</p>
              <div className="flex justify-between items-center gap-4 text-xs">
                <div className="text-center"><p className="text-[8px] text-gray-400 uppercase font-bold">Inc</p><p className="font-black text-green-600">+{rateData?.snfIncrement || 0}</p></div>
                <div className="text-center"><p className="text-[8px] text-gray-400 uppercase font-bold">Dec</p><p className="font-black text-red-500">-{rateData?.snfDecrement || 0}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between text-emerald-500 shadow-lg shadow-emerald-100/50">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Users size={24} /></div>
          <div className="text-right">
            <p className="text-black font-black text-[9px] uppercase tracking-widest">Total Registered</p>
            <h3 className="text-4xl font-black">{registeredCount}</h3>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            Today's Overview <div className="h-[1px] w-20 md:w-40 bg-gray-200" />
          </h2>
          <button onClick={() => fetchData(false)} className="flex items-center gap-2 bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-indigo-500">
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="text-[9px] font-black uppercase">Refresh</span>
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatSmallCard icon={Droplets} title="Total Milk" value={stats.todayMilk} unit="Ltrs" color="bg-blue-500" />
            <StatSmallCard icon={TrendingUp} title="Avg Fat" value={stats.avgFat} unit="%" color="bg-orange-500" />
            <StatSmallCard icon={ArrowUpRight} title="Revenue" value={`₹${stats.todayRevenue}`} color="bg-emerald-500" />
            <StatSmallCard icon={History} title="Entries" value={stats.todayEntries} color="bg-purple-500" />
        </div>
      </div>

      {/* 3. NEW: 10-DAY COMPARISON TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center gap-2 bg-slate-900 text-white">
          <CalendarDays size={16} className="text-blue-400" />
          <h2 className="font-black uppercase tracking-tight text-[10px]">Monthly Cycle Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black uppercase text-gray-400 bg-gray-50">
                <th className="p-3 text-center border-r border-gray-100 text-blue-600">Date</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right border-r-2 border-gray-200">Amt</th>
                <th className="p-3 text-center border-r border-gray-100 text-orange-600 bg-orange-50/30">Date</th>
                <th className="p-3 text-center bg-orange-50/30">Qty</th>
                <th className="p-3 text-right border-r-2 border-gray-200 bg-orange-50/30">Amt</th>
                <th className="p-3 text-center border-r border-gray-100 text-emerald-600">Date</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="p-3 text-center font-black border-r border-gray-100">{row.p1.day}</td>
                  <td className="p-3 text-center text-gray-500">{row.p1.qty > 0 ? row.p1.qty.toFixed(1) : '-'}</td>
                  <td className="p-3 text-right font-bold border-r-2 border-gray-200 text-slate-700">₹{row.p1.amt.toFixed(0)}</td>
                  <td className="p-3 text-center font-black border-r border-gray-100 bg-orange-50/20">{row.p2.day}</td>
                  <td className="p-3 text-center text-gray-500 bg-orange-50/20">{row.p2.qty > 0 ? row.p2.qty.toFixed(1) : '-'}</td>
                  <td className="p-3 text-right font-bold border-r-2 border-gray-200 bg-orange-50/20 text-slate-700">₹{row.p2.amt.toFixed(0)}</td>
                  <td className="p-3 text-center font-black border-r border-gray-100">{row.p3.day || ''}</td>
                  <td className="p-3 text-center text-gray-500">{row.p3.qty > 0 ? row.p3.qty.toFixed(1) : '-'}</td>
                  <td className="p-3 text-right font-bold text-slate-700">₹{row.p3.amt.toFixed(0)}</td>
                </tr>
              ))}
              {/* TOTAL ROW */}
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="p-3 text-center font-black text-blue-600 uppercase text-[9px]">Total</td>
                <td className="p-3 text-center font-black">{totals.p1.qty.toFixed(1)}</td>
                <td className="p-3 text-right font-black border-r-2 border-gray-200">₹{totals.p1.amt.toFixed(0)}</td>
                <td className="p-3 text-center font-black text-orange-600 uppercase text-[9px] bg-orange-50/30">Total</td>
                <td className="p-3 text-center font-black bg-orange-50/30">{totals.p2.qty.toFixed(1)}</td>
                <td className="p-3 text-right font-black border-r-2 border-gray-200 bg-orange-50/30">₹{totals.p2.amt.toFixed(0)}</td>
                <td className="p-3 text-center font-black text-emerald-600 uppercase text-[9px]">Total</td>
                <td className="p-3 text-center font-black">{totals.p3.qty.toFixed(1)}</td>
                <td className="p-3 text-right font-black">₹{totals.p3.amt.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECENT COLLECTIONS */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Search size={16} className="text-indigo-400" />
                <h2 className="font-black uppercase tracking-tight text-xs text-slate-800">Recent Collections</h2>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                {/* ... (Your existing Table Body Code) ... */}
                <tbody className="divide-y divide-gray-50">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-indigo-50 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black text-indigo-600 border border-indigo-100">{log.code}</span> 
                          <div>
                            <p className="font-black text-sm text-slate-800 leading-none">{getCustomerName(log.code)}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{log.date.split('-').reverse().join('/')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-sm text-slate-700">{log.qty}L</td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-sm text-emerald-600">₹{log.amount}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const StatSmallCard = ({ icon: Icon, title, value, unit, color }) => (
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center mb-2 shadow-sm`}>
        <Icon className="text-white" size={18} />
      </div>
      <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-lg font-black text-slate-800">{value}</h3>
        {unit && <span className="text-gray-400 text-[10px] font-bold">{unit}</span>}
      </div>
    </div>
);

export default Dashboard;