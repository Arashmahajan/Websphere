import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const LoginPage: React.FC = () => {
  const { login, availableUsers } = useAuth();
  const [email, setEmail] = useState('admin@worksphere.local');
  const [password, setPassword] = useState('WorkSphere@2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication rejected. Verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('WorkSphere@2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-3xl text-white">domain</span>
          </div>
          <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white mt-1">
            WorkSphere Enterprise
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            Mission-critical Workforce Management, Biometric Attendance & Payroll Processing
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <span className="material-symbols-outlined text-base text-rose-400">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Corporate Email ID
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@worksphere.local"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating with PostgreSQL...</span>
              </>
            ) : (
              <>
                <span>Sign In to WorkSphere</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Seeded Credentials */}
        <div className="pt-4 border-t border-slate-700/80 flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Seeded RBAC Demo Accounts (1-Click Fill)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {availableUsers.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => handleSelectDemoAccount(u.email)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col ${
                  email === u.email
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-900/50 border-slate-700/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate text-white">{u.fullName}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {u.role}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">{u.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Spring Security • JWT • BCrypt • PostgreSQL ACID Enforced</span>
        </div>
      </div>
    </div>
  );
};
