import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Search, 
  Calendar, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { api } from '../lib/api.js';

export default function NewCollection() {
  const navigate = useNavigate();
  
  // Lists fetched from master database
  const [members, setMembers] = useState<any[]>([]);
  const [produceTypes, setProduceTypes] = useState<any[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);

  // Search filter for members
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  // Form states
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedProduce, setSelectedProduce] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [ratePerUnit, setRatePerUnit] = useState<string>('');
  const [qualityGrade, setQualityGrade] = useState<string>('A');
  const [moisturePercent, setMoisturePercent] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [collectedAt, setCollectedAt] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );

  // Calculation and ML states
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [prediction, setPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successRecord, setSuccessRecord] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Ref for dropdown click-outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial master lists
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [memList, prodList, cpList] = await Promise.all([
          api.get<any[]>('/members?pageSize=100'),
          api.get<any[]>('/produce-types'),
          api.get<any[]>('/collection-points'),
        ]);
        setMembers(memList);
        setProduceTypes(prodList);
        setCollectionPoints(cpList);
        if (cpList.length > 0) setSelectedPoint(cpList[0]);
      } catch (err) {
        console.error('Failed to load form metadata lists.', err);
      }
    };
    fetchMasters();
  }, []);

  // Handle dropdown click-outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMemberDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update live preview calculations
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const rate = parseFloat(ratePerUnit) || 0;
    setGrossAmount(Math.round(qty * rate * 100) / 100);
  }, [quantity, ratePerUnit]);

  // Fetch current rate when produce type or collection point change
  useEffect(() => {
    if (!selectedProduce) return;
    const fetchCurrentRate = async () => {
      try {
        const query = `/rates/current?produceTypeId=${selectedProduce.id}${
          selectedPoint ? `&collectionPointId=${selectedPoint.id}` : ''
        }`;
        const rateRecord = await api.get<any>(query);
        if (rateRecord) {
          // Adjust rate based on grade
          let modifier = 1.0;
          if (qualityGrade === 'B') modifier = 0.9;
          if (qualityGrade === 'C') modifier = 0.8;
          setRatePerUnit((rateRecord.ratePerUnit * modifier).toFixed(2));
        } else {
          setRatePerUnit('');
        }
      } catch (err) {
        console.error('Could not load current rate.', err);
      }
    };
    fetchCurrentRate();
  }, [selectedProduce, selectedPoint, qualityGrade]);

  // Debounced live risk prediction request
  useEffect(() => {
    if (!selectedMember || !selectedProduce || !selectedPoint || !quantity || !ratePerUnit) {
      setPrediction(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPredicting(true);
      try {
        const res = await api.post('/predictions/attention', {
          memberId: selectedMember.id,
          produceTypeId: selectedProduce.id,
          collectionPointId: selectedPoint.id,
          quantity: parseFloat(quantity),
          ratePerUnit: parseFloat(ratePerUnit),
          qualityGrade,
          moisturePercent: moisturePercent ? parseFloat(moisturePercent) : null,
          notes,
          collectedAt: new Date(collectedAt).toISOString()
        });
        setPrediction(res);
      } catch (err) {
        console.error('Error fetching live prediction.', err);
      } finally {
        setPredicting(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedMember, selectedProduce, selectedPoint, quantity, ratePerUnit, qualityGrade, moisturePercent, notes, collectedAt]);

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedProduce || !selectedPoint || !quantity || !ratePerUnit) return;

    setSaving(true);
    setFieldErrors({});
    setServerError(null);

    try {
      const payload = {
        memberId: selectedMember.id,
        produceTypeId: selectedProduce.id,
        collectionPointId: selectedPoint.id,
        quantity: parseFloat(quantity),
        ratePerUnit: parseFloat(ratePerUnit),
        qualityGrade,
        moisturePercent: moisturePercent ? parseFloat(moisturePercent) : null,
        notes,
        collectedAt: new Date(collectedAt).toISOString()
      };

      const result: any = await api.post('/deliveries', payload);
      setSuccessRecord(result);
    } catch (err: any) {
      console.error(err);
      if (err.statusCode === 400 && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setServerError(err.message || 'An error occurred while saving the collection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedMember(null);
    setQuantity('');
    setMoisturePercent('');
    setNotes('');
    setSuccessRecord(null);
    setPrediction(null);
    setFieldErrors({});
    setServerError(null);
  };

  // Filter members list based on typing
  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.memberCode.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Success Overlay Card
  if (successRecord) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md bg-surface-white rounded-2xl border border-border-custom shadow-xl p-8 text-center space-y-6 success-pop">
          <div className="flex items-center justify-center w-16 h-16 bg-action-green/10 rounded-full mx-auto success-pop">
            <CheckCircle2 className="w-10 h-10 text-action-green" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] text-action-green font-extrabold uppercase tracking-widest bg-action-green/10 px-2.5 py-1 rounded-full">
              Collection Saved Authoritatively
            </span>
            <h3 className="text-xl font-bold text-primary-green font-display">Slip Generated</h3>
            <p className="text-xs text-text-muted">Receipt Number: <code className="font-mono font-bold bg-warm-cream px-1.5 py-0.5 rounded">{successRecord.receiptNumber}</code></p>
          </div>

          <div className="bg-warm-cream/50 rounded-xl p-4 border border-border-custom text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-border-custom/50 pb-2">
              <span className="text-text-muted font-bold">Farmer:</span>
              <span className="font-bold text-text-dark">{successRecord.member.fullName} ({successRecord.member.memberCode})</span>
            </div>
            <div className="flex justify-between border-b border-border-custom/50 pb-2">
              <span className="text-text-muted font-bold">Produce:</span>
              <span className="font-bold text-text-dark">{successRecord.produceType.name}</span>
            </div>
            <div className="flex justify-between border-b border-border-custom/50 pb-2">
              <span className="text-text-muted font-bold">Quantity:</span>
              <span className="font-bold text-text-dark">{successRecord.quantity} {successRecord.unit}</span>
            </div>
            <div className="flex justify-between border-b border-border-custom/50 pb-2">
              <span className="text-text-muted font-bold">Rate:</span>
              <span className="font-bold text-text-dark">₹{successRecord.ratePerUnit.toFixed(2)} / {successRecord.unit}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-primary-green font-bold text-sm">Authoritative Total:</span>
              <span className="font-extrabold text-primary-green text-sm">₹{successRecord.netAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Attention status alert if model flagged it */}
          {successRecord.attentionStatus !== 'NONE' && (
            <div className="flex items-start gap-3 p-3 bg-harvest-amber/10 border border-harvest-amber/20 rounded-lg text-left text-xs">
              <AlertTriangle className="w-5 h-5 text-harvest-amber shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary-green">Flagged for Verification</p>
                <p className="text-[10px] text-text-muted">{successRecord.notes || 'Anomalous features triggered a review status.'}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-primary-green hover:bg-action-green text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
            >
              Record Another Delivery
            </button>
            <button
              onClick={() => navigate(`/members/${successRecord.memberId}`)}
              className="w-full py-2.5 border border-border-custom hover:bg-warm-cream/50 text-primary-green font-bold rounded-lg text-xs cursor-pointer transition-colors"
            >
              Open Member Statement
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full py-2 bg-transparent hover:text-action-green text-text-muted text-[11px] font-semibold transition-colors"
            >
              Go to Collection Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Live risk banner logic
  let riskLevel = "Low attention risk";
  let riskColor = "bg-green-50 border-green-200 text-green-700";
  if (prediction) {
    if (prediction.predictedClass === 'ATTENTION') {
      riskLevel = "High attention risk - will flag for Secretary review";
      riskColor = "bg-error-red/10 border-error-red/20 text-error-red";
    } else if (prediction.predictedClass === null) {
      riskLevel = "No confident prediction - review normally";
      riskColor = "bg-warm-cream border-border-custom text-text-muted";
    } else {
      riskLevel = "Low attention risk";
      riskColor = "bg-green-50 border-green-200 text-green-700";
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Entry Form Card */}
      <div className="lg:col-span-2 bg-surface-white border border-border-custom rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-primary-green font-display">Delivery Parameters</h3>
          <p className="text-xs text-text-muted">Enter member delivery data at collection scales.</p>
        </div>

        {serverError && (
          <div className="p-4 bg-error-red/10 border border-error-red/20 text-error-red text-xs rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSaveCollection} className="space-y-5">
          {/* Member Search Field */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Farmer / Member
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-text-muted" />
              <input
                type="text"
                placeholder={selectedMember ? `${selectedMember.fullName} (${selectedMember.memberCode})` : "Search by member code, name, village..."}
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberDropdownOpen(true);
                }}
                onFocus={() => setMemberDropdownOpen(true)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                  fieldErrors.memberId ? 'border-error-red' : 'border-border-custom'
                }`}
              />
            </div>
            {fieldErrors.memberId && <p className="text-[10px] text-error-red mt-1">{fieldErrors.memberId}</p>}

            {memberDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-surface-white border border-border-custom rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-border-custom/50">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberSearch('');
                        setMemberDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-warm-cream/50 transition-colors text-xs flex justify-between items-center"
                    >
                      <span className="font-bold text-text-dark">{m.fullName} ({m.memberCode})</span>
                      <span className="text-[10px] text-text-muted">{m.village}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-text-muted">
                    No members match search query
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Produce Type */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Produce Type
              </label>
              <select
                onChange={(e) => {
                  const pt = produceTypes.find(p => p.id === e.target.value);
                  setSelectedProduce(pt || null);
                }}
                value={selectedProduce?.id || ''}
                className={`w-full px-3 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                  fieldErrors.produceTypeId ? 'border-error-red' : 'border-border-custom'
                }`}
                required
              >
                <option value="">-- Choose Produce --</option>
                {produceTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.defaultUnit})
                  </option>
                ))}
              </select>
              {fieldErrors.produceTypeId && <p className="text-[10px] text-error-red mt-1">{fieldErrors.produceTypeId}</p>}
            </div>

            {/* Collection Point */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Collection Point
              </label>
              <select
                onChange={(e) => {
                  const cp = collectionPoints.find(c => c.id === e.target.value);
                  setSelectedPoint(cp || null);
                }}
                value={selectedPoint?.id || ''}
                className={`w-full px-3 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                  fieldErrors.collectionPointId ? 'border-error-red' : 'border-border-custom'
                }`}
                required
              >
                {collectionPoints.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.collectionPointId && <p className="text-[10px] text-error-red mt-1">{fieldErrors.collectionPointId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Quantity {selectedProduce ? `(${selectedProduce.defaultUnit})` : ''}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                  fieldErrors.quantity ? 'border-error-red' : 'border-border-custom'
                }`}
                required
              />
              {fieldErrors.quantity && <p className="text-[10px] text-error-red mt-1">{fieldErrors.quantity}</p>}
            </div>

            {/* Rate per Unit */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Rate (₹ per {selectedProduce ? selectedProduce.defaultUnit : 'unit'})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                  fieldErrors.ratePerUnit ? 'border-error-red' : 'border-border-custom'
                }`}
                required
              />
              {fieldErrors.ratePerUnit && <p className="text-[10px] text-error-red mt-1">{fieldErrors.ratePerUnit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quality Grade */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Quality Grade
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm"
              >
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Average)</option>
                <option value="C">Grade C (Low)</option>
              </select>
            </div>

            {/* Moisture Percent */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Moisture % (Optional)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={moisturePercent}
                onChange={(e) => setMoisturePercent(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                  fieldErrors.moisturePercent ? 'border-error-red' : 'border-border-custom'
                }`}
              />
              {fieldErrors.moisturePercent && <p className="text-[10px] text-error-red mt-1">{fieldErrors.moisturePercent}</p>}
            </div>
          </div>

          {/* Collection Date Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Collection Date & Time
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4.5 h-4.5 text-text-muted" />
                <input
                  type="datetime-local"
                  value={collectedAt}
                  onChange={(e) => setCollectedAt(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm ${
                    fieldErrors.collectedAt ? 'border-error-red' : 'border-border-custom'
                  }`}
                  required
                />
              </div>
              {fieldErrors.collectedAt && <p className="text-[10px] text-error-red mt-1">{fieldErrors.collectedAt}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Operator Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special remarks..."
                rows={1}
                className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-custom/50 flex gap-3">
            <button
              type="submit"
              disabled={saving || !selectedMember}
              className="flex-1 py-3 bg-primary-green hover:bg-action-green disabled:bg-primary-green/60 text-white font-bold rounded-lg text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Delivery...
                </>
              ) : (
                'Save Collection Slip'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 border border-border-custom hover:bg-warm-cream/50 text-text-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview / Estimator Side Card */}
      <div className="space-y-6">
        <div className="bg-surface-white border border-border-custom rounded-2xl shadow-sm p-6 space-y-4">
          <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider">Live Slip Calculator</h4>
          
          <div className="flex flex-col items-center justify-center py-6 bg-warm-cream/50 rounded-xl border border-border-custom relative overflow-hidden">
            <div className={`p-3 rounded-full bg-primary-green/10 text-primary-green mb-3 ${quantity && ratePerUnit ? 'scale-animate' : ''}`}>
              <Scale className="w-8 h-8" />
            </div>
            
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Authoritative Estimate</span>
            <p className="text-3xl font-extrabold text-primary-green font-display mt-1">₹{grossAmount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-text-muted mt-1">Calculated on secure server logic</p>
          </div>

          <div className="space-y-2 text-xs text-text-dark">
            <div className="flex justify-between py-1 border-b border-border-custom/50">
              <span className="text-text-muted font-bold">Farmer:</span>
              <span className="font-bold truncate max-w-[150px]">{selectedMember ? selectedMember.fullName : '--'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-custom/50">
              <span className="text-text-muted font-bold">Produce:</span>
              <span className="font-bold">{selectedProduce ? selectedProduce.name : '--'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-custom/50">
              <span className="text-text-muted font-bold">Calculated Rate:</span>
              <span className="font-bold">₹{ratePerUnit ? parseFloat(ratePerUnit).toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted font-bold">Moisture Deductions:</span>
              <span className="font-bold">None (Omitted)</span>
            </div>
          </div>
        </div>

        {/* Live Attention Risk estimator card */}
        {selectedMember && selectedProduce && selectedPoint && quantity && ratePerUnit && (
          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-colors ${riskColor}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Live Risk Evaluator
              </h4>
              {predicting && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-extrabold leading-tight">{riskLevel}</p>
              {prediction && prediction.predictedClass && (
                <p className="text-[10px] font-bold">
                  Classifier Probability: {Math.round(prediction.probability * 100)}% (Model Version {prediction.modelVersion})
                </p>
              )}
            </div>

            {prediction && prediction.explanation && (
              <p className="text-[10px] font-medium leading-relaxed italic border-t border-current/10 pt-2 text-text-muted">
                {prediction.explanation}
              </p>
            )}
            
            <div className="flex items-center gap-1.5 text-[9px] font-bold opacity-80 pt-1">
              <Info className="w-3.5 h-3.5" />
              <span>Estimator preview only. Slip logic calculated during transactional save.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
