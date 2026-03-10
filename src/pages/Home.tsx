import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code?: string; message?: string; error?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Something went wrong. Please try again.' });
      } else {
        setResult({ code: data.code, message: data.message });
      }
    } catch (error) {
      setResult({ error: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <Link
          to="/admin"
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 hover:bg-neutral-800"
        >
          <Lock className="w-4 h-4" />
          Admin Login
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">Get Your Referral Code</h1>
            <p className="text-neutral-400 text-sm mt-2 text-center">
              Register below to claim your exclusive KSB code. Limited to 26 spots!
            </p>
          </div>

          {!result?.code ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-neutral-400 text-sm font-medium">+233</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    pattern="[0-9]{9}"
                    title="Please enter a valid 9-digit Ghana phone number without the leading 0 (e.g., 241234567)"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-14 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    placeholder="24 123 4567"
                  />
                </div>
              </div>

              {result?.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 flex items-start gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{result.error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Claim My Code'
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 py-4"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-medium">{result.message}</h2>
                <p className="text-neutral-400 text-sm">Your exclusive referral code is:</p>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full">
                <div className="font-mono text-4xl font-bold text-emerald-400 tracking-wider">
                  {result.code}
                </div>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                }}
                className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Register another person
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
