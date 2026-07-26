import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Search, 
  Loader2, 
  AlertCircle, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  IndianRupee,
  CheckCircle,
  HelpCircle,
  Clock,
  X
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function AttentionQueue() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal state
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveAttentionValue, setResolveAttentionValue] = useState(false);
  const [resolveCategory, setResolveCategory] = useState('Quality verified');

  const fetchAttentionCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any[]>('/attention');
      setCases(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load attention cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttentionCases();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setResolving(true);
    try {
      await api.post(`/deliveries/${selectedCase.id}/attention-status`, {
        status: 'RESOLVED',
        note: resolveNote || 'Manually verified by Secretary',
        neededAttention: resolveAttentionValue,
        reasonCategory: resolveCategory
      });
      setSelectedCase(null);
      setResolveNote('');
      fetchAttentionCases(); // refresh queue
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 space-y-4 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
        <span className="text-xs text-text-muted font-medium">Loading attention queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-surface-white border border-border-custom rounded-2xl p-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-error-red mb-3" />
        <h3 className="text-lg font-bold text-primary-green mb-1">Failed to load queue</h3>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <button 
          onClick={fetchAttentionCases}
          className="px-4 py-2 bg-primary-green text-white text-xs font-bold rounded-lg hover:bg-action-green transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm flex items-start gap-4">
        <div className="p-3 rounded-xl bg-error-red/10 text-error-red shrink-0">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-primary-green font-display">Attention Alerts Register</h3>
          <p className="text-xs text-text-muted">
            The machine learning classifier flags deliveries that lie outside normal bounds. Secretaries review and resolve alerts below.
          </p>
        </div>
      </div>

      {cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((item) => (
            <div key={item.id} className="stagger-card bg-surface-white border border-border-custom rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-warm-cream border border-border-custom px-2 py-0.5 rounded">
                    {item.receiptNumber}
                  </span>
                  <span className="bg-error-red/10 text-error-red font-extrabold px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                    {Math.round(item.prediction?.probability * 100 || 0)}% Risk
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-primary-green text-sm">{item.member.fullName} ({item.member.memberCode})</h4>
                  <p className="text-[10px] text-text-muted">Village: {item.member.village} | Phone: {item.member.phone || '--'}</p>
                </div>

                <div className="p-3 bg-warm-cream/50 rounded-lg border border-border-custom text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Collection Point:</span>
                    <span className="font-bold">{item.collectionPoint.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Produce Weight:</span>
                    <span className="font-bold">{item.quantity} {item.unit} of {item.produceType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Slip Rate:</span>
                    <span className="font-bold">₹{item.ratePerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary-green">
                    <span>Delivery Amount:</span>
                    <span>₹{item.netAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Model Alert Trigger:</span>
                  <p className="text-[10px] text-error-red font-medium leading-relaxed italic">
                    {item.prediction?.explanationJson || 'Anomalous weight/rate bounds.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border-custom/50 flex gap-2">
                <button
                  onClick={() => setSelectedCase(item)}
                  className="flex-1 py-2 bg-primary-green hover:bg-action-green text-white text-xs font-bold rounded-lg cursor-pointer transition-colors text-center"
                >
                  Verify & Resolve Alert
                </button>
                <button
                  onClick={() => navigate(`/register?search=${item.receiptNumber}`)}
                  className="px-3 py-2 border border-border-custom hover:bg-warm-cream text-text-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  title="View full audit log"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-white border border-border-custom rounded-2xl p-12 text-center shadow-sm flex flex-col items-center gap-3">
          <ShieldCheck className="w-16 h-16 text-action-green success-pop" />
          <h3 className="text-lg font-display font-bold text-primary-green">Attention Queue is Empty</h3>
          <p className="text-xs text-text-muted max-w-sm">
            All collections are clear of anomalies. No flagged risk records need manual verification.
          </p>
        </div>
      )}

      {/* Verification Overlay Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
          
          <div className="relative w-full max-w-md bg-surface-white border border-border-custom rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 success-pop">
            
            <div className="flex items-center justify-between border-b border-border-custom/50 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-action-green" />
                <h4 className="font-bold text-primary-green text-sm font-display">Resolve Collection Alert</h4>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-1 hover:bg-warm-cream rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="bg-warm-cream/50 rounded-lg p-3 border border-border-custom text-xs space-y-1">
                <div>Receipt ID: <span className="font-mono font-bold text-text-dark">{selectedCase.receiptNumber}</span></div>
                <div>Farmer: <span className="font-bold text-text-dark">{selectedCase.member.fullName}</span></div>
                <div>Produce: <span className="font-bold text-text-dark">{selectedCase.quantity} {selectedCase.unit} of {selectedCase.produceType.name}</span></div>
                <div>Calculated Worth: <span className="font-bold text-primary-green">₹{selectedCase.netAmount.toFixed(2)}</span></div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Verify Decision Category</label>
                  <select
                    value={resolveCategory}
                    onChange={(e) => setResolveCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded border border-border-custom bg-warm-cream/10"
                  >
                    <option value="Quality verified">Quality Verified</option>
                    <option value="Quantity corrected">Quantity Corrected</option>
                    <option value="Rate dispute resolved">Rate Inconsistency Resolved</option>
                    <option value="Regular approved">Regular Approval</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="didNeedAttentionModal"
                    checked={resolveAttentionValue}
                    onChange={(e) => setResolveAttentionValue(e.target.checked)}
                    className="w-4 h-4 rounded text-action-green accent-action-green"
                  />
                  <label htmlFor="didNeedAttentionModal" className="font-bold text-text-dark text-[11px] select-none">
                    Confirm actual anomaly (Add to model training data)
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Secretary verification notes</label>
                  <textarea
                    placeholder="Enter resolution details..."
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-border-custom rounded bg-warm-cream/10 resize-none focus:outline-none focus:border-action-green"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border-custom/50">
                <button
                  type="submit"
                  disabled={resolving}
                  className="flex-1 py-2 bg-primary-green hover:bg-action-green text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {resolving ? 'Saving resolution...' : 'Confirm Resolution'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 border border-border-custom hover:bg-warm-cream text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
