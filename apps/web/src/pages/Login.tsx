import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Loader2, Leaf, ShieldAlert } from 'lucide-react';
import { api, setAuthToken, setLoggedInUser } from '../lib/api.js';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const response: any = await api.post('/auth/login', { email, password });
      setAuthToken(response.token);
      setLoggedInUser(response.user);
      onLogin();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'operator' | 'secretary' | 'admin') => {
    setEmail(`${role}@harvesttrust.com`);
    setPassword('password123');
    setError(null);
  };

  const handleDemoMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await api.post('/auth/login', { 
        email: 'admin@harvesttrust.com', 
        password: 'password123' 
      });
      setAuthToken(response.token);
      setLoggedInUser(response.user);
      onLogin();
      navigate('/');
    } catch (err: any) {
      setError('Demo Mode failed to start. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-warm-cream">
      {/* Left graphical panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary-green p-12 text-white relative overflow-hidden">
        {/* Background visual curve */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 C30,40 70,60 100,0 L100,100 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 bg-action-green rounded-lg success-pop">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-wide font-display">HarvestTrust</span>
        </div>

        <div className="my-auto max-w-md relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight font-display mb-4">
            Every delivery recorded.<br />
            Every payment explained.
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            A transparent produce collection and payment register for farmer groups.
            Ensuring high traceability, precise calculations, and trust at every scale.
          </p>
        </div>

        <div className="text-xs text-white/50 relative z-10 flex justify-between">
          <span>Student: JANARTHANAN V</span>
          <span>Register: 411723205021</span>
        </div>
      </div>

      {/* Right Login panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-surface-white rounded-2xl shadow-xl border border-border-custom p-8 page-transition">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-primary-green font-display mb-1">Welcome back</h3>
            <p className="text-sm text-text-muted">Sign in to manage collections and ledger records.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-error-red/10 border border-error-red/20 rounded-lg text-error-red text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@harvesttrust.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border-custom bg-warm-cream/30 focus:border-action-green focus:outline-none transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-text-muted hover:text-primary-green"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-green hover:bg-action-green disabled:bg-primary-green/60 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Continue in Demo Mode helper */}
          <div className="mt-4">
            <button
              onClick={handleDemoMode}
              disabled={loading}
              className="w-full py-2.5 border border-dashed border-action-green/50 text-action-green hover:bg-action-green/5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              ⚡ Continue in Demo Mode (Bypass as Admin)
            </button>
          </div>

          {/* Quick-login credentials card */}
          <div className="mt-8 border-t border-border-custom pt-6">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              SIH Evaluation Demo Logins
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                className="px-2 py-1.5 bg-warm-cream hover:bg-border-custom text-[10px] font-bold text-primary-green rounded border border-border-custom text-center transition-colors truncate"
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('secretary')}
                className="px-2 py-1.5 bg-warm-cream hover:bg-border-custom text-[10px] font-bold text-primary-green rounded border border-border-custom text-center transition-colors truncate"
              >
                Secretary
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="px-2 py-1.5 bg-warm-cream hover:bg-border-custom text-[10px] font-bold text-primary-green rounded border border-border-custom text-center transition-colors truncate"
              >
                Admin
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-2 text-center">
              Password for all seeded accounts is <code className="bg-warm-cream px-1 py-0.5 rounded font-mono font-bold">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
