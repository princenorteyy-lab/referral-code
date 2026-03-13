import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Gift, CheckCircle2, AlertCircle, Loader2, Lock, ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function Home() {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    institution: '',
    courseOfStudy: '',
    yearOfStudy: '',
    hasGcbAccount: '',
    gcbAccountNumber: '',
    osChoice: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ link?: string; osChoice?: string; message?: string; error?: string } | null>(null);
  const [downloadMessage, setDownloadMessage] = useState('');

  const isFormValid = formData.fullName.trim() !== '' && 
    formData.email.trim() !== '' && 
    formData.phone.trim() !== '' && 
    formData.gender !== '' && 
    formData.institution.trim() !== '' && 
    formData.courseOfStudy.trim() !== '' && 
    formData.yearOfStudy !== '' && 
    formData.hasGcbAccount !== '' && 
    (formData.hasGcbAccount === 'No' || formData.gcbAccountNumber.trim() !== '') && 
    formData.osChoice !== '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = { ...formData };
    if (payload.hasGcbAccount === 'No') {
      payload.gcbAccountNumber = '';
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Something went wrong. Please try again.' });
      } else {
        setResult({ link: data.link, osChoice: data.osChoice, message: "Redirecting to app store..." });
        window.location.href = data.link;
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
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        backgroundColor: '#ffffff', // white
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `referral-code-${result?.code}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadMessage('File downloaded successfully!');
      setTimeout(() => setDownloadMessage(''), 3000);
    } catch (error) {
      console.error('Failed to generate PNG', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`referral-code-${result?.code}.pdf`);
      setDownloadMessage('File downloaded successfully!');
      setTimeout(() => setDownloadMessage(''), 3000);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <Link
          to="/admin"
          className="flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors bg-white border border-gray-200 rounded-full w-10 h-10 hover:bg-gray-200 shadow-sm"
          title="Admin Login"
        >
          <Lock className="w-4 h-4" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#FF7F50] p-8 flex flex-col items-center text-white">
            <h1 className="text-2xl font-bold tracking-tight text-center">GET YOUR FREE BEYOND THE HUSTLE E-BOOK</h1>
            <p className="text-white/90 text-sm mt-2 text-center">
              GCB is sponsoring 1,000 students to get the Beyond The Hustle Book FREE. Download the app now get your your access
            </p>
          </div>

          <div className="p-8">
            {!result?.link ? (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                  placeholder="jane@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium">+233</span>
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-14 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                      placeholder="24 123 4567"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="gender" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={(e: any) => handleChange(e)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="institution" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name of University/Institution
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  required
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                  placeholder="e.g. University of Ghana"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="courseOfStudy" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course of Study
                  </label>
                  <input
                    type="text"
                    id="courseOfStudy"
                    name="courseOfStudy"
                    required
                    value={formData.courseOfStudy}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="yearOfStudy" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year of Study
                  </label>
                  <select
                    id="yearOfStudy"
                    name="yearOfStudy"
                    required
                    value={formData.yearOfStudy}
                    onChange={(e: any) => handleChange(e)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>Select level</option>
                    <option value="Level 100">Level 100</option>
                    <option value="Level 200">Level 200</option>
                    <option value="Level 300">Level 300</option>
                    <option value="Level 400">Level 400</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="hasGcbAccount" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Do you have a GCB account?
                </label>
                <select
                  id="hasGcbAccount"
                  name="hasGcbAccount"
                  required
                  value={formData.hasGcbAccount}
                  onChange={(e: any) => handleChange(e)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {formData.hasGcbAccount === 'Yes' && (
                <div className="space-y-1.5">
                  <label htmlFor="gcbAccountNumber" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enter your GCB account number
                  </label>
                  <input
                    type="text"
                    id="gcbAccountNumber"
                    name="gcbAccountNumber"
                    required
                    value={formData.gcbAccountNumber}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                    placeholder="Account Number"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="osChoice" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Platform
                </label>
                <select
                  id="osChoice"
                  name="osChoice"
                  required
                  value={formData.osChoice}
                  onChange={(e: any) => handleChange(e)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select platform</option>
                  <option value="iOS">iOS (Apple App Store)</option>
                  <option value="Android">Android (Google Play Store)</option>
                </select>
              </div>

              {result?.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{result.error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Download App'
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 py-4"
            >
              <div className="flex flex-col items-center text-center space-y-6 w-full p-8 bg-white rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500"></div>
                
                <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mt-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-wide">
                    {formData.fullName}
                  </h2>
                  <p className="text-orange-500 text-sm font-medium uppercase tracking-wider">Registration Complete</p>
                </div>

                <div className="w-full h-px bg-gray-200 my-2"></div>

                <div className="space-y-2">
                  <p className="text-gray-500 text-sm">{result.message}</p>
                  <p className="text-gray-400 text-xs uppercase tracking-widest">If you are not redirected, click below</p>
                </div>

                <a
                  href={result.link}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Download className="w-5 h-5" />
                  Download for {result.osChoice}
                </a>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setFormData({ fullName: '', email: '', phone: '', gender: '', institution: '', courseOfStudy: '', yearOfStudy: '', hasGcbAccount: '', gcbAccountNumber: '', osChoice: '' });
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors mt-4"
              >
                Register another person
              </button>
            </motion.div>
          )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
