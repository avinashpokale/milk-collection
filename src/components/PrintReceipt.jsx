import React from 'react';
import { useAuth } from '../context/AuthContext';

// Move the styles here so they are central
export const thermalStyles = `
  @media print {
    body * { visibility: hidden; }
    #thermal-receipt, #thermal-receipt * { visibility: visible; }
    
    #thermal-receipt { 
      position: absolute; 
      left: 0; 
      top: 0; 
      width: 58mm !important; /* Forces width */
      max-width: 58mm !important;
      padding: 2mm; 
      margin: 0;
      box-sizing: border-box;
    }
    
    table { 
      width: 100% !important; /* Forces table to stretch */
    }

    @page { margin: 0; size: 58mm auto; }
  }
`;
const PrintReceipt = ({ data }) => {
  const { dairyDetails } = useAuth(); 
  
  if (!data) return null;

  return (
    <div id="thermal-receipt">
      <style>{thermalStyles}</style>
      
      {/* Header with Dairy Info from Context */}
      <div className="text-center border-b border-black pb-1 mb-1">
        <h1 className="font-bold text-[15px] uppercase leading-tight">
          {dairyDetails?.name || "MILK DAIRY"}
        </h1>
        <p className="text-[9px] uppercase">
          {dairyDetails?.address} {dairyDetails?.pincode}
        </p>
        <p className="text-[9px]">Ph: {dairyDetails?.phone}</p>
        <div className="border-t border-dotted border-black mt-1"></div>
        <h2 className="text-[11px] font-bold mt-1">MILK RECEIPT</h2>
        <p className="text-[9px]">{data.date}</p>
      </div>
      
      <div className="text-[12px] space-y-0.5">
        <p><strong>Code:</strong> {data.code}</p>
        <p><strong>Name:</strong> {data.customerName}</p>
        <div className="text-[12px]">
          {/* Table forces the layout even when Flexbox fails */}
          <table className="w-full border-collapse border-t">
            <tbody>
              <tr>
                <td className="text-left py-0.5">Qty:</td>
                <td className="text-right py-0.5">{data.qty} L</td>
              </tr>
              <tr>
                <td className="text-left py-0.5">Fat:</td>
                <td className="text-right py-0.5">{data.fat} %</td>
              </tr>
              <tr>
                <td className="text-left py-0.5">SNF:</td>
                <td className="text-right py-0.5">{data.snf} %</td>
              </tr>
              <tr>
                <td className="text-left py-0.5">Rate:</td>
                <td className="text-right py-0.5">₹{data.rate}</td>
              </tr>

              {/* Bold Total Row */}
              <tr className="font-bold text-[14px] border-t border-b">
                <td className="text-left py-1">TOTAL:</td>
                <td className="text-right py-1">₹{data.amount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-center text-[10px] mt-4">
        <p>Thank You!</p>
        <div className="h-10"></div> 
      </div>
    </div>
  );
};

export default PrintReceipt;