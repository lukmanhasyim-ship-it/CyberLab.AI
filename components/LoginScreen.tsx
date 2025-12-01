import React, { useState } from 'react';
import { UserProfile } from '../types';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (profile: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && grade.trim()) {
      onLogin({ name, grade });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-green-50">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md my-auto">
        <div className="glass-panel rounded-3xl shadow-2xl p-8 sm:p-10 transform transition-all hover:scale-[1.01] duration-500 border-t-4 border-t-emerald-500">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-yellow-400 rounded-2xl blur opacity-40 animate-pulse"></div>
              <div className="relative bg-white p-4 rounded-2xl shadow-md border border-emerald-50">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-500 mb-2 tracking-tight">
              CyberLab.Ai
              </h1>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
              Media Pembelajaran Interaktif TKJ
              </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-emerald-600">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                placeholder="Masukkan nama anda..."
              />
            </div>

            <div className="space-y-2 group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-emerald-600">Kelas</label>
              <div className="relative">
                <select
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-medium"
                >
                  <option value="" disabled className="text-gray-400">Pilih Kelas</option>
                  {[11, 12].map((g) => (
                    <option key={g} value={`Kelas ${g}`} className="text-gray-900 py-2">
                      Kelas {g} SMK
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-emerald-500">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="group w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg mt-6"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Mulai Belajar
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-10 font-medium">
              © 2025 SMK AL-AZHAR SEMPU
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;