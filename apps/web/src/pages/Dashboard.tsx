import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  Weight, 
  AlertCircle, 
  Users, 
  TrendingUp,
  ArrowRight,
  ClipboardCopy,
  PlusCircle,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../lib/api.js';

const COLORS = ['#14532D', '#16A34A', '#22C55E', '#F59E0B', '#FBBF24', '#34D399', '#60A5FA', '#818CF8'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-white rounded-xl border border-border-custom animate-pulse p-6 space-y-3">
              <div className="w-12 h-4 bg-warm-cream rounded" />
              <div className="w-24 h-6 bg-warm-cream rounded" />
            </div>
          ))}
        </div>
        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-surface-white border border-border-custom rounded-xl animate-pulse" />
          <div className="h-80 bg-surface-white border border-border-custom rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-surface-white border border-border-custom rounded-2xl p-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-error-red mb-3" />
        <h3 className="text-lg font-bold text-primary-green mb-1">Failed to load dashboard</h3>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="px-4 py-2 bg-primary-green text-white text-xs font-bold rounded-lg hover:bg-action-green transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, sevenDayTrend, produceDistribution, recentCollections, attentionQueue } = data;

  const cards = [
    { 
      title: "Today's Weight", 
      value: `${metrics.todayQuantity.toLocaleString('en-IN')} kg`, 
      icon: Weight, 
      color: 'bg-primary-green/10 text-primary-green',
      desc: "Total produce collected today" 
    },
    { 
      title: "Today's Value", 
      value: `₹${metrics.todayValue.toLocaleString('en-IN')}`, 
      icon: IndianRupee, 
      color: 'bg-action-green/10 text-action-green',
      desc: "Authoritative calculated worth" 
    },
    { 
      title: "Outstanding Balance", 
      value: `₹${metrics.pendingPaymentAmount.toLocaleString('en-IN')}`, 
      icon: IndianRupee, 
      color: 'bg-harvest-amber/10 text-harvest-amber',
      desc: "Total due across all members" 
    },
    { 
      title: "Needs Attention", 
      value: metrics.recordsAttentionCount, 
      icon: AlertCircle, 
      color: metrics.recordsAttentionCount > 0 ? 'bg-error-red/10 text-error-red' : 'bg-green-100 text-green-700',
      desc: "High risk cases waiting review" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header welcome */}
      <div className="bg-primary-green text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <h3 className="text-2xl font-bold font-display">A transparent produce ledger for farmer groups</h3>
          <p className="text-sm text-white/80 max-w-xl">
            HarvestTrust records member deliveries, computes authoritative slip amounts, and handles anomalies using ML.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 z-10 shrink-0">
          <Link 
            to="/collection/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-action-green hover:bg-white hover:text-primary-green text-white text-xs font-bold rounded-lg shadow transition-all duration-150 cursor-pointer"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Record Collection
          </Link>
          <Link 
            to="/payments"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-primary-green hover:bg-warm-cream text-xs font-bold rounded-lg shadow transition-all duration-150 cursor-pointer"
          >
            <IndianRupee className="w-4.5 h-4.5" />
            Record Payment
          </Link>
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stagger-card bg-surface-white border border-border-custom rounded-xl p-6 shadow-sm flex items-start justify-between gap-4" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="space-y-2">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{card.title}</span>
                <p className="text-2xl font-extrabold text-text-dark font-display">{card.value}</p>
                <p className="text-[10px] text-text-muted">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-surface-white border border-border-custom rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-primary-green uppercase tracking-wider">7-Day Quantity & Value Trend</h4>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-action-green" />
              <span className="text-xs text-text-muted font-medium">Daily volumes</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sevenDayTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#66736B" fontSize={10} tickLine={false} />
                <YAxis stroke="#66736B" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="quantity" name="Quantity (kg)" stroke="#16A34A" fillOpacity={1} fill="url(#colorQty)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share Chart */}
        <div className="bg-surface-white border border-border-custom rounded-xl p-6 shadow-sm flex flex-col space-y-4">
          <h4 className="text-sm font-bold text-primary-green uppercase tracking-wider">Produce Share</h4>
          <div className="h-48 flex-1">
            {produceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={produceDistribution}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {produceDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} kg`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No collections recorded yet
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[10px] font-semibold text-text-muted">
            {produceDistribution.slice(0, 4).map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <div className="bg-surface-white border border-border-custom rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-primary-green uppercase tracking-wider">Recent Collections</h4>
            <Link to="/register" className="text-action-green hover:underline text-xs font-bold flex items-center gap-1">
              View Register <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentCollections.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-custom text-text-muted uppercase font-bold tracking-wider">
                    <th className="py-2.5">Receipt</th>
                    <th className="py-2.5">Member</th>
                    <th className="py-2.5">Produce</th>
                    <th className="py-2.5">Weight</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50 text-text-dark font-medium">
                  {recentCollections.map((c: any) => (
                    <tr key={c.id} className="hover:bg-warm-cream/30">
                      <td className="py-2.5 font-mono">{c.receiptNumber}</td>
                      <td className="py-2.5 truncate max-w-[120px]">{c.member.fullName}</td>
                      <td className="py-2.5">{c.produceType.name}</td>
                      <td className="py-2.5">{c.quantity} {c.unit}</td>
                      <td className="py-2.5 text-right text-primary-green font-bold">₹{c.netAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                No recent collections found.
              </div>
            )}
          </div>
        </div>

        {/* Attention Queue */}
        <div className="bg-surface-white border border-border-custom rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-error-red uppercase tracking-wider">High Attention Risk cases</h4>
            <Link to="/attention" className="text-action-green hover:underline text-xs font-bold flex items-center gap-1">
              Review Queue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {attentionQueue.length > 0 ? (
              attentionQueue.map((item: any) => (
                <div key={item.id} className="p-3 bg-error-red/5 border border-error-red/10 rounded-lg flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-dark">{item.member.fullName} ({item.member.memberCode})</span>
                      <span className="bg-error-red/10 text-error-red font-extrabold px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wide">
                        {Math.round(item.riskProbability * 100)}% Risk
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted font-medium italic">
                      {item.riskExplanation.replace(/^"|"$/g, '')}
                    </p>
                    <div className="text-[9px] text-text-muted font-bold">
                      {item.produceType.name} - {item.quantity} {item.unit} | Receipt: <span className="font-mono">{item.receiptNumber}</span>
                    </div>
                  </div>
                  <Link 
                    to={`/register?search=${item.receiptNumber}`}
                    className="p-1 hover:bg-error-red/10 rounded text-error-red transition-colors cursor-pointer"
                    title="Review delivery details"
                  >
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-action-green" />
                <span>All records are clear. No cases need attention.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
