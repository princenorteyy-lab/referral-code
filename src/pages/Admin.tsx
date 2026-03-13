import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Lock, Users, LogOut, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  institution: string;
  courseOfStudy: string;
  yearOfStudy: string;
  hasGcbAccount: string;
  gcbAccountNumber: string;
  osChoice: string;
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

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
      'Full Name': u.fullName,
      Email: u.email,
      'Phone Number': `+233 ${u.phone}`,
      Gender: u.gender,
      Institution: u.institution,
      'Course of Study': u.courseOfStudy,
      'Year of Study': u.yearOfStudy,
      'Has GCB Account': u.hasGcbAccount,
      'GCB Account Number': u.gcbAccountNumber || 'N/A',
      'OS Choice': u.osChoice
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Referrals');
    
    // Generate buffer and trigger download
    XLSX.writeFile(workbook, 'referrals_data.xlsx');
  };

  const handleReset = async () => {
    setLoading(true);
    setResetMessage('');
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers([]);
        setResetMessage("All data has been successfully reset.");
      } else {
        setResetMessage("Failed to reset data.");
      }
    } catch (err) {
      console.error('Failed to reset data', err);
      setResetMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirmReset(false);
      setTimeout(() => setResetMessage(''), 5000);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-200"
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
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-blue-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-center">Admin Access</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                  placeholder="Enter admin password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start gap-3 text-sm">
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 mt-16 sm:mt-12">
        {resetMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-sm font-medium ${resetMessage.includes('success') ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}
          >
            {resetMessage}
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-indigo-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Referrals Database</h1>
              <p className="text-gray-500 text-sm">{users.length} registered users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirmReset(true)}
              disabled={loading || users.length === 0}
              className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              Reset Data
            </button>
            <button
              onClick={exportToExcel}
              disabled={users.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Full Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Institution</th>
                  <th className="px-6 py-4 font-medium">GCB Account</th>
                  <th className="px-6 py-4 font-medium">OS Choice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No users registered yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{user.id}</td>
                      <td className="px-6 py-4 font-medium">{user.fullName}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 text-gray-500">+233 {user.phone}</td>
                      <td className="px-6 py-4 text-gray-500">{user.institution}</td>
                      <td className="px-6 py-4 text-gray-500">{user.hasGcbAccount === 'Yes' ? user.gcbAccountNumber : 'No'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          {user.osChoice}
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

      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reset Database?</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete ALL registered users? This action cannot be undone and all referral codes will be released.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete All'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
