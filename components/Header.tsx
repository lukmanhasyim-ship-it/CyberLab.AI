import React from 'react';
import { UserProfile } from '../types';
import { LogOut, PieChart, BookOpen } from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
  onHome: () => void;
  onReport: () => void;
  onLearn: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onHome, onReport, onLearn }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-md transform active:scale-95 transition-transform">
            {/* Simple logo text or icon */}
            <span className="text-white font-extrabold text-xl">A</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight text-lg sm:text-xl tracking-tight">CyberLab.Ai</h1>
            <p className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">SMK AL-AZHAR SEMPU</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop Navigation - Hidden on Mobile */}
          <button 
             onClick={onLearn}
             className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors hover:bg-emerald-50 px-3 py-2 rounded-lg"
          >
            <BookOpen className="w-4 h-4" />
            Materi
          </button>

          <button 
             onClick={onReport}
             className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors hover:bg-emerald-50 px-3 py-2 rounded-lg"
          >
            <PieChart className="w-4 h-4" />
            Rapor
          </button>

          <div className="flex flex-col items-end border-l pl-3 sm:pl-4 border-gray-200">
            <span className="text-sm font-bold text-gray-700 max-w-[100px] truncate">{user.name}</span>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{user.grade}</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:bg-red-100"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;