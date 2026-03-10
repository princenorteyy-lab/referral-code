import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Lock, Users, LogOut, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  code: string;
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setUsers([]);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(users.map(u => ({
      ID: u.id,
      'First Name': u.firstName,
      'Last Name': u.lastName,
      Email: u.email,
      'Phone Number': `+233 ${u.phone}`,
      'Referral Code': u.code
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Referrals');
    
    // Generate buffer and trigger download
    XLSX.writeFile(workbook, 'referrals_data.xlsx');
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete ALL registered users? This cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers([]);
        alert("All data has been reset.");
      } else {
        alert("Failed to reset data.");
      }
    } catch (err) {
      console.error('Failed to reset data', err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-center">Admin Access</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  placeholder="Enter admin password"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors flex items-center justify-center disabled:opacity-50 mt-6"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 hover:bg-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 mt-16 sm:mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Referrals Database</h1>
              <p className="text-neutral-400 text-sm">{users.length} registered users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={loading || users.length === 0}
              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              Reset Data
            </button>
            <button
              onClick={exportToExcel}
              disabled={users.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={handleLogout}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/50 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">First Name</th>
                  <th className="px-6 py-4 font-medium">Last Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      No users registered yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-neutral-500">{user.id}</td>
                      <td className="px-6 py-4 font-medium">{user.firstName}</td>
                      <td className="px-6 py-4 font-medium">{user.lastName}</td>
                      <td className="px-6 py-4 text-neutral-400">{user.email}</td>
                      <td className="px-6 py-4 text-neutral-400">+233 {user.phone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {user.code}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
