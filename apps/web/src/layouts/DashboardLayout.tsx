import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Users, 
  Wallet, 
  AlertTriangle, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  User,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { getLoggedInUser, removeAuthToken, removeLoggedInUser } from '../lib/api.js';

interface DashboardLayoutProps {
  onLogout: () => void;
}

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      navigate('/login');
    } else {
      setUser(loggedUser);
    }
  }, [navigate]);

  const handleLogoutClick = () => {
    removeAuthToken();
    removeLoggedInUser();
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['OPERATOR', 'SECRETARY', 'ADMIN'] },
    { name: 'New Collection', path: '/collection/new', icon: PlusCircle, roles: ['OPERATOR', 'ADMIN'] },
    { name: 'Register', path: '/register', icon: FileText, roles: ['OPERATOR', 'SECRETARY', 'ADMIN'] },
    { name: 'Members', path: '/members', icon: Users, roles: ['OPERATOR', 'SECRETARY', 'ADMIN'] },
    { name: 'Payments', path: '/payments', icon: Wallet, roles: ['SECRETARY', 'ADMIN'] },
    { name: 'Attention Queue', path: '/attention', icon: AlertTriangle, roles: ['SECRETARY', 'ADMIN'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['SECRETARY', 'ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => 
    user ? item.roles.includes(user.role) : false
  );

  const activePage = navItems.find(item => item.path === location.pathname)?.name || 'HarvestTrust';

  if (!user) return null;

  return (
    <div className="flex h-screen bg-warm-cream">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-primary-green text-white border-r border-border-custom shadow-lg">
        {/* Brand header */}
        <div className="flex items-center gap-3 p-6 border-b border-white/10">
          <div className="flex items-center justify-center w-10 h-10 bg-action-green rounded-lg success-pop">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide font-display">HarvestTrust</h1>
            <p className="text-[10px] text-fresh-leaf font-medium">Every delivery recorded.</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-action-green text-white shadow-md' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold leading-tight">{user.name}</p>
              <span className="text-[10px] text-fresh-leaf font-bold tracking-wider">{user.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white/10 hover:bg-error-red text-white text-xs font-semibold rounded-lg transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (overlay + container) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-primary-green text-white h-full animate-slideUp">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-action-green" />
                <span className="font-bold text-lg font-display">HarvestTrust</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive 
                        ? 'bg-action-green text-white shadow-md' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 bg-black/10">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5" />
                <div className="truncate">
                  <p className="text-xs font-semibold leading-tight">{user.name}</p>
                  <span className="text-[10px] text-fresh-leaf font-bold">{user.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white/10 hover:bg-error-red text-white text-xs font-semibold rounded-lg transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-surface-white border-b border-border-custom shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-warm-cream rounded-lg text-text-dark"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-primary-green tracking-wide font-display">{activePage}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick action buttons for convenience */}
            {user.role !== 'SECRETARY' && (
              <Link 
                to="/collection/new"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-action-green hover:bg-primary-green text-white text-xs font-bold rounded-lg shadow-sm transition-colors duration-150"
              >
                <PlusCircle className="w-4 h-4" />
                New Collection
              </Link>
            )}
            
            <div className="flex items-center gap-2 bg-warm-cream px-3 py-1.5 rounded-lg border border-border-custom">
              <div className="w-2.5 h-2.5 bg-fresh-leaf rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{user.role} Mode</span>
            </div>
          </div>
        </header>

        {/* Sub-page content Outlet */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 page-transition">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
