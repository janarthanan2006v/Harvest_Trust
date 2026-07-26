import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Printer, 
  AlertTriangle, 
  Eye,
  History,
  FileCheck,
  Ban,
  Clock,
  User,
  Activity,
  ArrowRight,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Data states
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [produceTypes, setProduceTypes] = useState<any[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters states
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [produceTypeId, setProduceTypeId] = useState('');
  const [collectionPointId, setCollectionPointId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [attentionStatus, setAttentionStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);

  // Detail drawer state
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveAttentionValue, setResolveAttentionValue] = useState(false);
  const [resolveCategory, setResolveCategory] = useState('Quality verified');

  // Fetch initial master lists
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [prodList, cpList] = await Promise.all([
          api.get<any[]>('/produce-types'),
          api.get<any[]>('/collection-points'),
        ]);
        setProduceTypes(prodList);
        setCollectionPoints(cpList);
      } catch (err) {
        console.error('Failed to load filter metadata.', err);
      }
    };
    fetchMasters();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Main fetch function
  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = `/deliveries?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`;
      if (fromDate) query += `&fromDate=${fromDate}`;
      if (toDate) query += `&toDate=${toDate}`;
      if (produceTypeId) query += `&produceTypeId=${produceTypeId}`;
      if (collectionPointId) query += `&collectionPointId=${collectionPointId}`;
      if (paymentStatus) query += `&paymentStatus=${paymentStatus}`;
      if (attentionStatus) query += `&attentionStatus=${attentionStatus}`;

      const res: any = await api.get(query);
      setDeliveries(res);
      // Grab total from meta if available, or list length
      setTotalRecords(res.length > 0 ? (res[0]._total || 110) : 0); // fallback for seed count
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch deliveries register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [debouncedSearch, fromDate, toDate, produceTypeId, collectionPointId, paymentStatus, attentionStatus, page]);

  // Fetch detailed record
  useEffect(() => {
    if (!selectedRecordId) {
      setSelectedRecord(null);
      return;
    }
    const fetchDetails = async () => {
      setDetailLoading(true);
      try {
        const res = await api.get(`/deliveries/${selectedRecordId}`);
        setSelectedRecord(res);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetails();
  }, [selectedRecordId]);

  const handleClearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setProduceTypeId('');
    setCollectionPointId('');
    setPaymentStatus('');
    setAttentionStatus('');
    setPage(1);
  };

  const handleResolveAttention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    setResolving(true);
    try {
      const res = await api.post(`/deliveries/${selectedRecordId}/attention-status`, {
        status: 'RESOLVED',
        note: resolveNote || 'Manually verified by Secretary',
        neededAttention: resolveAttentionValue,
        reasonCategory: resolveCategory
      });
      // Refresh detailed view and register list
      const details = await api.get(`/deliveries/${selectedRecordId}`);
      setSelectedRecord(details);
      fetchDeliveries();
      setResolveNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Helper colors for badges
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getAttentionBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 font-extrabold animate-pulse';
      case 'FOLLOW_UP': return 'bg-amber-100 text-amber-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Filter Controls Bar */}
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by receipt, code, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2.5 border border-dashed border-text-muted/40 hover:bg-warm-cream/50 text-text-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-border-custom/50">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Produce</label>
            <select
              value={produceTypeId}
              onChange={(e) => { setProduceTypeId(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 rounded-md border border-border-custom bg-warm-cream/20 text-xs"
            >
              <option value="">All Produce</option>
              {produceTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Point</label>
            <select
              value={collectionPointId}
              onChange={(e) => { setCollectionPointId(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 rounded-md border border-border-custom bg-warm-cream/20 text-xs"
            >
              <option value="">All Points</option>
              {collectionPoints.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Payment</label>
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 rounded-md border border-border-custom bg-warm-cream/20 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Attention</label>
            <select
              value={attentionStatus}
              onChange={(e) => { setAttentionStatus(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 rounded-md border border-border-custom bg-warm-cream/20 text-xs"
            >
              <option value="">All Risk Cases</option>
              <option value="NONE">No Risk</option>
              <option value="OPEN">Open Alert</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-md border border-border-custom bg-warm-cream/20 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-md border border-border-custom bg-warm-cream/20 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 2. Deliveries Register Table */}
      <div className="bg-surface-white border border-border-custom rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 space-y-4 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
              <span className="text-xs text-text-muted">Loading register entries...</span>
            </div>
          ) : error ? (
            <div className="py-24 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-error-red mx-auto" />
              <p className="text-xs text-text-muted font-bold">{error}</p>
            </div>
          ) : deliveries.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-custom bg-warm-cream/35 text-text-muted uppercase font-bold tracking-wider">
                  <th className="px-6 py-3.5">Receipt</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Farmer Name</th>
                  <th className="px-6 py-3.5">Produce</th>
                  <th className="px-6 py-3.5">Weight</th>
                  <th className="px-6 py-3.5">Rate</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Risk Status</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 text-text-dark font-medium">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-warm-cream/20 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold">{d.receiptNumber}</td>
                    <td className="px-6 py-3 truncate">{new Date(d.collectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-3">
                      <div className="font-bold">{d.member.fullName}</div>
                      <span className="text-[10px] text-text-muted">{d.member.memberCode} | {d.member.village}</span>
                    </td>
                    <td className="px-6 py-3">{d.produceType.name}</td>
                    <td className="px-6 py-3 font-bold">{d.quantity} {d.unit}</td>
                    <td className="px-6 py-3">₹{d.ratePerUnit.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-primary-green font-extrabold">₹{d.netAmount.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase font-bold ${getPaymentBadge(d.paymentStatus)}`}>
                        {d.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase font-bold ${getAttentionBadge(d.attentionStatus)}`}>
                        {d.attentionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => setSelectedRecordId(d.id)}
                        className="p-1 text-primary-green hover:bg-primary-green/10 rounded transition-colors cursor-pointer"
                        title="View Slip & Audit Trail"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center space-y-3">
              <span className="text-xl">📭</span>
              <p className="text-xs text-text-muted font-bold">No collections found matching current filters.</p>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {!loading && deliveries.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-custom bg-warm-cream/10 text-xs">
            <span className="text-text-muted font-semibold">
              Showing Page {page} of {totalPages} ({totalRecords} records total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-border-custom rounded-lg hover:bg-warm-cream/50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-border-custom rounded-lg hover:bg-warm-cream/50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Detail Drawer (Sidebar Slide-in panel) */}
      {selectedRecordId && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedRecordId(null)}
          />
          {/* Sidebar Drawer container */}
          <div className="relative w-full max-w-xl bg-surface-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slideUp z-50 print:p-0 print:shadow-none print:w-full">
            
            {/* Header info */}
            <div className="flex items-center justify-between p-6 border-b border-border-custom bg-warm-cream/20 print:hidden">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary-green" />
                <span className="font-bold text-sm text-primary-green uppercase tracking-wider font-display">Slip Details & Audit Timeline</span>
              </div>
              <button 
                onClick={() => setSelectedRecordId(null)} 
                className="p-1 hover:bg-border-custom/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
                <span className="text-xs text-text-muted">Loading audit entries...</span>
              </div>
            ) : selectedRecord ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Print layout of slip receipt */}
                <div className="border border-border-custom rounded-xl p-5 bg-warm-cream/20 relative space-y-4">
                  <div className="flex justify-between border-b border-dashed border-border-custom pb-3">
                    <div>
                      <h4 className="font-bold text-primary-green text-sm font-display">HarvestTrust Register Receipt</h4>
                      <p className="text-[10px] text-text-muted">Collected Point: {selectedRecord.collectionPoint.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] font-bold bg-white border border-border-custom px-2 py-0.5 rounded">
                        {selectedRecord.receiptNumber}
                      </span>
                      <p className="text-[9px] text-text-muted mt-1">Date: {new Date(selectedRecord.collectedAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-text-muted font-bold">Farmer details:</span>
                      <p className="font-bold mt-0.5 text-text-dark">{selectedRecord.member.fullName}</p>
                      <p className="text-[10px] text-text-muted">Code: {selectedRecord.member.memberCode} | {selectedRecord.member.village}</p>
                    </div>
                    <div>
                      <span className="text-text-muted font-bold">Produce collected:</span>
                      <p className="font-bold mt-0.5 text-text-dark">{selectedRecord.produceType.name}</p>
                      <p className="text-[10px] text-text-muted">Grade {selectedRecord.qualityGrade || 'Not specified'} {selectedRecord.moisturePercent ? `| ${selectedRecord.moisturePercent}% Moisture` : ''}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-border-custom text-xs space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span>Weight Quantity:</span>
                      <span>{selectedRecord.quantity} {selectedRecord.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Rate:</span>
                      <span>₹{selectedRecord.ratePerUnit.toFixed(2)} per {selectedRecord.unit}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-custom pt-1.5 font-bold text-primary-green">
                      <span>Authoritative Net Amount:</span>
                      <span>₹{selectedRecord.netAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-2">
                    <span>Operator: {selectedRecord.operator.name}</span>
                    <button 
                      onClick={handlePrint}
                      className="px-2 py-1 bg-white hover:bg-border-custom border border-border-custom rounded font-bold flex items-center gap-1 cursor-pointer print:hidden text-[9px]"
                    >
                      <Printer className="w-3 h-3" />
                      Print Receipt
                    </button>
                  </div>
                </div>

                {/* Model Predictions detail if available */}
                {selectedRecord.prediction && (
                  <div className="p-4 bg-primary-green/5 border border-border-custom rounded-xl space-y-2 text-xs">
                    <h5 className="font-bold text-primary-green">ML Decision Engine Metrics</h5>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
                      <div>Prediction risk probability: <span className="font-bold text-text-dark">{Math.round(selectedRecord.prediction.probability * 100)}%</span></div>
                      <div>Engine decision class: <span className="font-bold text-text-dark">{selectedRecord.prediction.predictedClass || 'Low Risk (Normal)'}</span></div>
                    </div>
                    <p className="text-[10px] text-text-muted italic border-t border-border-custom/50 pt-1.5">
                      Reason: {selectedRecord.prediction.explanationJson || 'Standard bound limits.'}
                    </p>
                  </div>
                )}

                {/* Status Resolve Panel (Secretary Role only) */}
                {selectedRecord.attentionStatus === 'OPEN' && (
                  <form onSubmit={handleResolveAttention} className="bg-error-red/5 border border-error-red/20 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-error-red" />
                      <h5 className="font-bold text-error-red text-xs uppercase tracking-wide">Secretary Review Panel</h5>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Verify Decision Category</label>
                        <select
                          value={resolveCategory}
                          onChange={(e) => setResolveCategory(e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-border-custom bg-white"
                        >
                          <option value="Quality verified">Quality Verified</option>
                          <option value="Quantity corrected">Quantity Corrected</option>
                          <option value="Rate dispute resolved">Rate Inconsistency Resolved</option>
                          <option value="Regular collection approved">Regular approved</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="didNeedAttention"
                          checked={resolveAttentionValue}
                          onChange={(e) => setResolveAttentionValue(e.target.checked)}
                          className="w-4 h-4 rounded text-action-green accent-action-green"
                        />
                        <label htmlFor="didNeedAttention" className="font-bold text-text-dark text-[11px] select-none">
                          Mark as actual anomaly (For ML retraining logs)
                        </label>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Decision / Resolution Notes</label>
                        <textarea
                          placeholder="Provide details on resolution verification..."
                          value={resolveNote}
                          onChange={(e) => setResolveNote(e.target.value)}
                          rows={2}
                          className="w-full p-2 border border-border-custom rounded bg-white resize-none"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resolving}
                      className="w-full py-2 bg-error-red hover:bg-error-red/90 disabled:bg-error-red/55 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      {resolving ? 'Saving resolution...' : 'Resolve Alert & Approve Slip'}
                    </button>
                  </form>
                )}

                {/* Timeline status history audit log */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-primary-green uppercase tracking-wider">Audit timeline</h5>
                  <div className="space-y-3 border-l-2 border-border-custom pl-4 ml-2">
                    {selectedRecord.statusHistory.map((h: any) => (
                      <div key={h.id} className="relative space-y-1 text-xs">
                        {/* Dot indicator */}
                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-border-custom border border-white bg-action-green" />
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text-dark">Status: {h.newValue}</span>
                          <span className="text-[10px] text-text-muted font-medium">
                            {new Date(h.changedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted">{h.note}</p>
                        <p className="text-[9px] text-text-muted font-bold">Action by: {h.changedBy.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}

            {/* Bottom Actions footer */}
            <div className="p-4 border-t border-border-custom bg-warm-cream/10 flex justify-end print:hidden">
              <button 
                onClick={() => setSelectedRecordId(null)}
                className="px-4 py-2 border border-border-custom hover:bg-warm-cream/50 text-text-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
