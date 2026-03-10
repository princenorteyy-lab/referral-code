import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Gift, CheckCircle2, AlertCircle, Loader2, Lock, ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function App() {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
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

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#171717', // neutral-900
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `referral-code-${result?.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate PNG', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#171717',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`referral-code-${result?.code}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
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
              <div ref={cardRef} className="flex flex-col items-center text-center space-y-6 w-full p-8 bg-neutral-900 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mt-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white tracking-wide">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <p className="text-emerald-400 text-sm font-medium uppercase tracking-wider">Beyond The Hustle Ambassador</p>
                </div>

                <div className="w-full h-px bg-neutral-800 my-2"></div>

                <div className="space-y-2">
                  <p className="text-neutral-400 text-sm">{result.message}</p>
                  <p className="text-neutral-500 text-xs uppercase tracking-widest">Your exclusive code</p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full shadow-inner">
                  <div className="font-mono text-5xl font-bold text-emerald-400 tracking-widest">
                    {result.code}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 w-full">
                <p className="text-indigo-400 text-sm font-medium">
                  📸 Please take a screenshot of this screen or download it to save your code!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={handleDownloadPNG}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Save as PNG
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Save as PDF
                </button>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                }}
                className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors mt-4"
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
