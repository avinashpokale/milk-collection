import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Printer, Search, Loader2, Landmark } from 'lucide-react';

const Billing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dairy, setDairy] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [cycle, setCycle] = useState('1');
  const [allBills, setAllBills] = useState([]);

  const toWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const makeGroup = (n) => {
      let st = '';
      if (n >= 100) { st += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
      if (n >= 20) { st += b[Math.floor(n / 10)] + ' ' + a[n % 10]; } else { st += a[n]; }
      return st;
    };
    let n = Math.floor(num);
    if (n === 0) return 'Zero';
    let out = '';
    if (Math.floor(n / 1000) > 0) { out += makeGroup(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
    out += makeGroup(n);
    return out.trim() + ' Only';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      const dairySnap = await getDoc(doc(db, "dairyDetails", user.uid));
      if (dairySnap.exists()) setDairy(dairySnap.data());
      const custSnap = await getDocs(query(collection(db, "customers"), where("userId", "==", user.uid)));
      setCustomers(custSnap.docs.map(doc => doc.data()));
    };
    fetchData();
  }, [user?.uid]);

  const generateReport = async () => {
    setLoading(true);
    const [year, monthNum] = month.split('-');
    let startDay, endDay;
    if (cycle === '1') { startDay = 1; endDay = 10; }
    else if (cycle === '2') { startDay = 11; endDay = 20; }
    else { startDay = 21; endDay = new Date(year, monthNum, 0).getDate(); }
    const startDate = `${year}-${monthNum}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${monthNum}-${String(endDay).padStart(2, '0')}`;

    try {
      let q = selectedCustomer === 'all' 
        ? query(collection(db, "dailyCollections"), where("userId", "==", user.uid), where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date", "asc"))
        : query(collection(db, "dailyCollections"), where("userId", "==", user.uid), where("code", "==", selectedCustomer), where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date", "asc"));

      const snap = await getDocs(q);
      const allData = snap.docs.map(doc => doc.data());
      const grouped = allData.reduce((acc, curr) => {
        if (!acc[curr.code]) acc[curr.code] = [];
        acc[curr.code].push(curr);
        return acc;
      }, {});

      setAllBills(Object.entries(grouped).map(([code, data]) => ({
        code,
        name: customers.find(c => c.code === code)?.name || "Unknown",
        address:customers.find(c => c.code === code)?.address || "Unknown",
        data,
        startDate: startDate.split('-').reverse().join('-'),
        endDate: endDate.split('-').reverse().join('-'),
        totalQty: data.reduce((s, r) => s + parseFloat(r.qty), 0),
        totalAmt: data.reduce((s, r) => s + parseFloat(r.amount), 0)
      })));
    } catch (err) { alert("Error generating report."); }
    finally { setLoading(false); }
  };

  const grandTotalQty = allBills.reduce((acc, curr) => acc + curr.totalQty, 0);
  const grandTotalAmt = allBills.reduce((acc, curr) => acc + curr.totalAmt, 0);
  return (
    <div className="p-4 md:p-8 billing-main-container bg-gray-50 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { 
          size: A4 portrait; 
          margin: 15mm; 
        }

        @media print {
          /* Targeted hiding for the subscription bar and any fixed overlays */
          .fixed, [class*="SubscriptionWrapper"], .bg-orange-500 {
            display: none !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Remove the top padding from the main wrapper during print */
          div[class*="pt-9"] {
            padding-top: 0 !important;
          }
            
          /* 1. HIDE EVERYTHING EXCEPT THE BILLS */
          nav, aside, header, footer, .no-print, button, .sidebar, .navbar, .subscription-alert { 
            display: none !important; 
          }

          /* 2. RESET LAYOUT WRAPPERS */
          html, body, #root, .flex, main, section, .billing-main-container {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            position: static !important;
          }

          /* 3. ENSURE EACH BILL STARTS ON NEW PAGE */
          .bill-card { 
            display: block !important;
            page-break-after: always !important; 
            break-after: page !important;
            padding: 10mm 0 !important;
            border-bottom: 2px solid black !important;
            margin-bottom: 0 !important;
          }

          /* 4. SUMMARY PAGE BREAK */
          .summary-card {
            display: block !important;
            page-break-before: always !important; 
            break-before: page !important;
            border: 3px solid black !important;
            padding: 15mm !important;
          }

          /* 5. FIX TABLE RENDERING */
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td {  padding: 8px !important; color: black !important; }
          .font-black { font-weight: 900 !important; color: black !important; }
        }
      `}} />

      {/* --- SELECTION UI (Remains hidden on print) --- */}
      <div className="max-w-4xl mx-auto space-y-8 no-print mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="p-3 bg-gray-50 rounded-xl font-bold border-none ring-1 ring-gray-200" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
            <option value="all">All Farmers</option>
            {customers.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
          </select>
          <input type="month" className="p-3 bg-gray-50 rounded-xl font-bold border-none ring-1 ring-gray-200" value={month} onChange={(e) => setMonth(e.target.value)} />
          <select className="p-3 bg-gray-50 rounded-xl font-bold border-none ring-1 ring-gray-200" value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="1">1st to 10th</option>
            <option value="2">11th to 20th</option>
            <option value="3">21st to End</option>
          </select>
          
          <button 
            onClick={generateReport} 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black rounded-xl px-4 py-3 hover:bg-blue-700 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />} 
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* --- PRINTABLE AREA --- */}
      <div className="printable-area max-w-4xl mx-auto bg-white">
        {allBills.map((bill, index) => (
          <div key={index} className="bill-card bg-white p-8 md:p-10 mb-6  text-black">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-3xl font-black uppercase tracking-tighter">{dairy?.name || "SHIVSAGAR DAIRY"}</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest">{dairy?.address || "DEVGAON"} • {dairy?.phone || "2345678909"}</p>
              
              <div className="mt-6 flex justify-between border-t border-black pt-4 text-left">
                <div>
                  <p className="text-[10px] font-black uppercase">CODE: <span className="text-base font-black">{bill.code}</span></p>
                  <p className="text-[10px] font-black uppercase">FARMER: <span className="text-base font-black uppercase">{bill.name}</span></p>
                  <p className="text-[10px] font-black uppercase">ADDRESS: <span className="text-[10px]">{bill.address}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase">PERIOD</p>
                  <p className="text-xs font-black">{bill.startDate} to {bill.endDate}</p>
                </div>
              </div>
            </div>

            <table className="w-full text-left text-sm mb-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-[10px] font-black uppercase">
                  <th className="py-2">Sr.</th>
                  <th className="py-2">Date</th>
                  <th className="py-2 text-center">Qty(L)</th>
                  <th className="py-2 text-center">Fat</th>
                  <th className="py-2 text-center">SNF</th>
                  <th className="py-2 text-center">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.data.map((row, i) => (
                  <tr key={i} className="font-bold border-b border-gray-100">
                    <td className="py-2 text-[10px]">{i + 1}</td>
                    <td className="py-2 text-xs">{row.date.split('-').reverse().join('-')}</td>
                    <td className="py-2 text-center">{parseFloat(row.qty).toFixed(1)} L</td>
                    <td className="py-2 text-center">{parseFloat(row.fat).toFixed(1)} %</td>
                    <td className="py-2 text-center">{parseFloat(row.snf).toFixed(1)} %</td>
                    <td className="py-2 text-center text-xs">₹{row.rate}</td>
                    <td className="py-2 text-right">₹{row.amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-black font-black">
                <tr>
                  <td colSpan="4" className="py-4 text-[10px] uppercase font-black">Grand Totals</td>
                  <td className="py-4 text-center text-lg font-black">{bill.totalQty.toFixed(1)}</td>
                  <td></td>
                  <td className="py-4 text-right text-xl font-black">₹{bill.totalAmt.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="p-4 border border-black italic text-[11px] font-bold uppercase">
              Amount In Words: Rupees {toWords(bill.totalAmt)}
            </div>
          </div>
        ))}

        {/* --- SUMMARY SECTION --- */}
        {allBills.length > 1 && (
          <div className="summary-card bg-white p-12 mt-10">
            <div className="text-center mb-10 border-b-4 border-black pb-6">
              {/* LANDMARK ICON & TITLE ALIGNED */}
              <div className="flex justify-center items-center gap-3">
                <Landmark size={32} />
                <h2 className="text-3xl font-black uppercase tracking-tight">Cycle Payout Summary</h2>
              </div>
              
              {/* PERIOD ON NEW LINE */}
              <div className="mt-4">
                <p className="text-base font-black uppercase">
                   Period: {allBills[0].startDate} To {allBills[0].endDate}
                </p>
              </div>
            </div>
            
            <table className="w-full text-left border-collapse mb-10">
              <thead>
                <tr className="border-b-2 border-black text-[10px] font-black uppercase">
                  <th className="p-4">Farmer Detail</th>
                  <th className="p-4 text-center">Total Qty (Ltrs)</th>
                  <th className="p-4 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {allBills.map((bill, i) => (
                  <tr key={i} className="font-bold text-lg">
                    <td className="p-4 uppercase">{bill.code} - {bill.name}</td>
                    <td className="p-4 text-center font-black">{bill.totalQty.toFixed(1)}</td>
                    <td className="p-4 text-right font-black">₹{bill.totalAmt.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-4 border-black font-black bg-white">
                <tr>
                  <td className="p-6 text-xl uppercase font-black">Total Cash Requirement</td>
                  <td className="p-6 text-center text-2xl font-black">{grandTotalQty.toFixed(1)} Ltrs</td>
                  <td className="p-6 text-right text-4xl font-black">₹{grandTotalAmt.toFixed(0)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="text-center font-black italic uppercase text-sm">
              Rupees {toWords(grandTotalAmt)}
            </p>
          </div>
        )}
      </div>

      {/* Floating Print Button */}
      {allBills.length > 0 && (
        <button 
          onClick={() => window.print()} 
          className="fixed bottom-24 right-8 p-6 bg-green-600 text-white rounded-full shadow-2xl no-print z-50 hover:scale-110 active:scale-95 transition-transform"
        >
          <Printer size={32} />
        </button>
      )}
    </div>
  );
};

export default Billing;