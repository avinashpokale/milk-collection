import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Printer, Search, Loader2, Landmark, Smartphone } from 'lucide-react';


const Billing = () => {
  // 1. Get dairy from auth context as requested
  const { user,dairyDetails } = useAuth();
  const dairy = dairyDetails; 

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [cycle, setCycle] = useState('1');
  const [allBills, setAllBills] = useState([]);
  
  // State to control printer target
  const [printTarget, setPrintTarget] = useState('a4');

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
        address: customers.find(c => c.code === code)?.address || "Unknown",
        data,
        startDate: startDate.split('-').reverse().join('-'),
        endDate: endDate.split('-').reverse().join('-'),
        totalQty: data.reduce((s, r) => s + parseFloat(r.qty), 0),
        totalAmt: data.reduce((s, r) => s + parseFloat(r.amount), 0)
      })));
    } catch (err) { alert("Error generating report."); }
    finally { setLoading(false); }
  };

  const handlePrint = (mode) => {
    setPrintTarget(mode);
    document.body.setAttribute('data-print', mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const grandTotalQty = allBills.reduce((acc, curr) => acc + curr.totalQty, 0);
  const grandTotalAmt = allBills.reduce((acc, curr) => acc + curr.totalAmt, 0);

  return (
    <div className="p-4 md:p-8 billing-main-container bg-gray-50 min-h-screen">
     <style dangerouslySetInnerHTML={{ __html: `
  /* Screen Defaults */
  .thermal-print-area { display: none; }
  .a4-print-area { display: block; }

  @media print {
    .no-print { display: none !important; }

    /* Fix the A4 Container */
    body[data-print="a4"] .a4-print-area { 
      display: block !important;
      width: 210mm !important; /* Full A4 Width */
      background: white !important;
    }

    /* Create the 2x2 Grid manually using Flex */
    body[data-print="a4"] .a4-print-area > div:not(.summary-card) {
      display: inline-block !important;
      vertical-align: top !important;
      width: 100mm !important; /* Slightly less than half of A4 */
      height: 142mm !important; /* Slightly less than half of A4 height */
      margin: 2mm !important;
      padding: 4mm !important;
      border: 1px solid black !important;
      box-sizing: border-box !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
    }

    /* Fix Header alignment (Code, Farmer, Period) */
    body[data-print="a4"] .mt-6.flex.justify-between {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      margin-top: 5px !important;
      border-top: 1px solid black !important;
      padding-top: 5px !important;
    }

    /* Scale Down Content */
    body[data-print="a4"] .bill-card h1 { font-size: 1.1rem !important; margin: 0 !important; }
    body[data-print="a4"] .bill-card p { font-size: 8px !important; line-height: 1.1 !important; }
    body[data-print="a4"] table { font-size: 8.5px !important; margin-bottom: 4px !important; }
    body[data-print="a4"] th, body[data-print="a4"] td { padding: 2px 1px !important; }
    body[data-print="a4"] .text-xl, body[data-print="a4"] .text-lg { font-size: 14px !important; }
    
    /* Ensure "Amount in Words" stays small and at the bottom */
    body[data-print="a4"] .p-4.border.border-black.italic {
      padding: 2px !important;
      font-size: 8px !important;
      border-width: 1px !important;
    }

    /* Cycle Payout Summary - Full Page */
    body[data-print="a4"] .summary-card {
      display: block !important;
      width: 190mm !important;
      margin: 10mm auto !important;
      page-break-before: always !important;
      border: 2px solid black !important;
    }

    /* Thermal Reset */
    body[data-print="thermal"] .a4-print-area { display: none !important; }
    body[data-print="thermal"] .thermal-print-area { display: block !important; width: 58mm !important; }
    
    @page { 
      size: A4 portrait; 
      margin: 0; /* Let the CSS handle margins */
    }
  }
`}} />

      {/* --- SELECTION UI --- */}
      <div className="max-w-4xl mx-auto space-y-8 no-print mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="p-3 bg-gray-50 rounded-xl font-bold border-none ring-1 ring-gray-200 text-black" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
            <option value="all">All Farmers</option>
            {customers.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
          </select>
          <input type="month" className="p-3 bg-gray-50 rounded-xl font-bold border-none ring-1 ring-gray-200 text-black" value={month} onChange={(e) => setMonth(e.target.value)} />
          <select className="p-3 bg-gray-50 rounded-xl font-bold border-none ring-1 ring-gray-200 text-black" value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="1">1st to 10th</option>
            <option value="2">11th to 20th</option>
            <option value="3">21st to End</option>
          </select>
          <button onClick={generateReport} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black rounded-xl px-4 py-3 hover:bg-blue-700 transition-colors">
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />} 
            <span>Generate</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* --- A4 VIEW (SCREEN DEFAULT) --- */}
        <div className="a4-print-area bg-white">
          {allBills.map((bill, index) => (
            <div key={index} className="bill-card bg-white p-8 md:p-10 mb-6 text-black border shadow-sm">
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter">{dairy?.name || "DAIRY"}</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest">{dairy?.address} • {dairy?.phone}</p>
                <div className="mt-6 flex justify-between border-t border-black pt-4 text-left font-bold uppercase">
                  <div>
                    <p className="text-[10px]">CODE: <span className="text-base font-black">{bill.code}</span></p>
                    <p className="text-[10px]">FARMER: <span className="text-base font-black">{bill.name}</span></p>
                  </div>
                  <div className="text-right text-xs font-black">
                    <p className="text-[10px]">PERIOD</p>
                    <p>{bill.startDate} to {bill.endDate}</p>
                  </div>
                </div>
              </div>
              <table className="w-full text-left text-sm mb-6 border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-[10px] font-black uppercase">
                    <th className="py-2">Sr.</th><th className="py-2">Date</th><th className="text-center">Qty</th><th className="text-center">Fat</th><th className="text-center">SNF</th><th className="text-center">Rate</th><th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.data.map((row, i) => (
                    <tr key={i} className="font-bold border-b border-gray-100">
                      <td className="py-2 text-[10px]">{i + 1}</td>
                      <td>{row.date.split('-').reverse().join('-')}</td>
                      <td className="text-center">{parseFloat(row.qty).toFixed(1)}L</td>
                      <td className="text-center">{parseFloat(row.fat).toFixed(1)}%</td>
                      <td className="text-center">{parseFloat(row.snf).toFixed(1)}%</td>
                      <td className="text-center">₹{row.rate}</td>
                      <td className="text-right font-black">₹{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-black font-black">
                  <tr>
                    <td colSpan="2" className="py-4 uppercase text-[10px]">Totals</td>
                    <td className="text-center text-lg">{bill.totalQty.toFixed(1)}</td>
                    <td colSpan="2"></td>
                    <td className="text-right text-xl">₹{bill.totalAmt.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="p-4 border border-black italic text-[11px] font-bold uppercase">
                Amount In Words: Rupees {toWords(bill.totalAmt)}
              </div>
            </div>
          ))}

          {/* --- A4 SUMMARY SECTION --- */}
          {allBills.length > 1 && (
            <div className="summary-card bg-white p-12 mt-10">
              <div className="text-center mb-10 border-b-4 border-black pb-6">
                <div className="flex justify-center items-center gap-3">
                  <Landmark size={32} />
                  <h2 className="text-3xl font-black uppercase tracking-tight">Cycle Payout Summary</h2>
                </div>
                <p className="mt-4 font-black uppercase tracking-widest">Period: {allBills[0].startDate} To {allBills[0].endDate}</p>
              </div>
              <table className="w-full text-left border-collapse mb-10">
                <thead>
                  <tr className="border-b-2 border-black text-[10px] font-black uppercase">
                    <th className="p-4">Farmer Detail</th><th className="p-4 text-center">Total Qty</th><th className="p-4 text-right">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {allBills.map((bill, i) => (
                    <tr key={i} className="font-bold text-lg">
                      <td className="p-4 uppercase font-black">{bill.code} - {bill.name}</td>
                      <td className="p-4 text-center font-black">{bill.totalQty.toFixed(1)}</td>
                      <td className="p-4 text-right font-black">₹{bill.totalAmt.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-4 border-black font-black bg-white">
                  <tr>
                    <td className="p-6 text-xl uppercase font-black">Total Cash Requirement</td>
                    <td className="p-6 text-center text-2xl font-black">{grandTotalQty.toFixed(1)} L</td>
                    <td className="p-6 text-right text-4xl font-black">₹{grandTotalAmt.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-center font-black italic uppercase text-sm">Rupees {toWords(grandTotalAmt)}</p>
            </div>
          )}
        </div>

        {/* --- THERMAL VIEW (HIDDEN ON SCREEN) --- */}
        <div className="thermal-print-area">
          {allBills.map((bill, index) => (
            <div key={index} className="w-[58mm] p-2 bg-white text-black border-b border-dashed mb-4">
              <h2 className="text-sm font-black text-center uppercase leading-tight">{dairy?.name}</h2>
              <p className="text-[10px] text-center border-b border-black">{dairy?.address}, {dairy?.phone}</p>
              <div className="text-[10px] my-2 font-bold uppercase leading-tight">
                 <p>Code : {bill.code}</p>
                 <p>Name : {bill.name}</p>
                 <p>{bill.startDate} To {bill.endDate}</p>
              </div>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-black font-black">
                    <td>Date</td><td>Qty</td><td>Fat</td><td>Snf</td><td className="text-right">Amt</td>
                  </tr>
                </thead>
                <tbody>
                  {bill.data.map((row, i) => (
                    <tr key={i}>
                      {/* <td>{row.date.split('-')[2]}</td> */}
                      <td>{row.date.split('-').reverse().join('-')}</td>
                      <td>{parseFloat(row.qty).toFixed(1)}</td>
                      <td>{parseFloat(row.fat).toFixed(1)}</td>
                      <td>{parseFloat(row.snf).toFixed(1)}</td>
                      <td className="text-right">₹{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-right font-black mt-2 text-xs border-t border-black pt-1">TOTAL: ₹{bill.totalAmt.toFixed(0)}</p>
              <p className="text-[8px] text-center mt-2 italic">*** Thank You ***</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- PRINT CONTROLS --- */}
      {allBills.length > 0 && (
        <div className="fixed bottom-10 right-8 flex flex-col gap-4 no-print z-50">
          <button onClick={() => handlePrint('a4')} className="p-6 bg-green-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform" title="A4 Print">
            <Printer size={32} />A4 Print
          </button>
          <button onClick={() => handlePrint('thermal')} className="p-6 bg-orange-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform" title="Thermal Print">
            <Smartphone size={32} />Thermal
          </button>
        </div>
      )}
    </div>
  );
};

export default Billing;