import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Loader2, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function Reports() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '/reports/summary';
      if (fromDate || toDate) {
        query += '?';
        if (fromDate) query += `fromDate=${fromDate}`;
        if (fromDate && toDate) query += '&';
        if (toDate) query += `toDate=${toDate}`;
      }
      const res = await api.get(query);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate report summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    // Build CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Produce Summary Report\n";
    csvContent += `Period: ${fromDate || 'All time'} to ${toDate || 'Today'}\n\n`;
    csvContent += "Produce,Code,Total Weight,Unit,Total Value (INR)\n";
    
    data.produceBreakdown.forEach((p: any) => {
      csvContent += `"${p.name}","${p.code}",${p.quantity},"${p.unit}",${p.value}\n`;
    });

    csvContent += `\nTotal Deliveries,${data.deliveriesCount}\n`;
    csvContent += `Total Delivered Value,${data.totalValue}\n`;
    csvContent += `Total Payments Recorded,${data.totalPayments}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `harvesttrust_report_${fromDate || 'all'}_to_${toDate || 'today'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="py-24 space-y-4 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
        <span className="text-xs text-text-muted font-medium">Generating report summaries...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-surface-white border border-border-custom rounded-2xl p-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-error-red mb-3" />
        <h3 className="text-lg font-bold text-primary-green mb-1">Failed to load reports</h3>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <button 
          onClick={fetchReport}
          className="px-4 py-2 bg-primary-green text-white text-xs font-bold rounded-lg hover:bg-action-green transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Date filters & print options */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-end justify-between print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Report From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Report To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-lg border border-border-custom bg-warm-cream/20 text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border-custom hover:bg-warm-cream/50 text-text-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-green hover:bg-action-green text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Summary
          </button>
        </div>
      </div>

      {/* 2. Group Summary Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm text-center space-y-1 print:border-none print:shadow-none">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Weight Collected</span>
          <p className="text-2xl font-extrabold text-primary-green font-display">{data.totalQuantity.toLocaleString('en-IN')} kg</p>
          <p className="text-[9px] text-text-muted">{data.deliveriesCount} total delivery receipts</p>
        </div>

        <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm text-center space-y-1 print:border-none print:shadow-none">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gross Value</span>
          <p className="text-2xl font-extrabold text-primary-green font-display">₹{data.totalValue.toLocaleString('en-IN')}</p>
          <p className="text-[9px] text-text-muted">Calculated authoritative pricing</p>
        </div>

        <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm text-center space-y-1 print:border-none print:shadow-none">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Payments Settled</span>
          <p className="text-2xl font-extrabold text-action-green font-display">₹{data.totalPayments.toLocaleString('en-IN')}</p>
          <p className="text-[9px] text-text-muted">{data.paymentsCount} recorded transaction slips</p>
        </div>
      </div>

      {/* 3. Produce Table Breakdown */}
      <div className="bg-surface-white border border-border-custom rounded-2xl shadow-sm overflow-hidden p-6 print:border-none print:shadow-none">
        
        {/* Printable brand header */}
        <div className="hidden print:flex justify-between items-start border-b border-border-custom pb-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-primary-green">HarvestTrust Register Report</h1>
            <p className="text-[10px] text-text-muted">Period: {fromDate || 'All Time'} - {toDate || 'Today'}</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold">JANARTHANAN V</span>
            <p className="text-[10px] text-text-muted">PSVPEC IT Year IV</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider">Produce Breakdown Ledger</h4>
          <div className="overflow-x-auto">
            {data.produceBreakdown.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-custom bg-warm-cream/25 text-text-muted uppercase font-bold tracking-wider">
                    <th className="px-4 py-3">Produce</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3 text-right">Total Weight</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3 text-right">Aggregate Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/40 text-text-dark font-medium">
                  {data.produceBreakdown.map((p: any) => (
                    <tr key={p.id} className="hover:bg-warm-cream/15">
                      <td className="px-4 py-2.5 font-bold">{p.name}</td>
                      <td className="px-4 py-2.5 font-mono">{p.code}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{p.quantity.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5">{p.unit}</td>
                      <td className="px-4 py-2.5 text-right text-primary-green font-extrabold font-mono">₹{p.value.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-green/5 font-extrabold text-primary-green border-t border-border-custom">
                    <td className="px-4 py-3" colSpan={2}>Aggregate Sums</td>
                    <td className="px-4 py-3 text-right font-mono">{data.totalQuantity.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">kg</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">₹{data.totalValue.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-text-muted">
                No produce collections registered in this range.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Collection Point Breakdown */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none">
        <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider">Collection Points Intake Value</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.pointBreakdown.map((pt: any) => (
            <div key={pt.id} className="p-4 bg-warm-cream/35 border border-border-custom rounded-xl flex items-center justify-between text-xs font-medium">
              <div>
                <span className="text-[10px] text-text-muted font-bold block">{pt.name}</span>
                <span className="font-mono text-[9px] text-text-muted uppercase">Code: {pt.code}</span>
              </div>
              <span className="font-extrabold text-primary-green text-sm font-mono">₹{pt.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
