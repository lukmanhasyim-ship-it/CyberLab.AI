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
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
        
        {/* Left Side: Logo & School Name */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={onHome}>
          <img src="/logo.png" alt="CyberLab.Ai Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-gray-800 leading-none text-base sm:text-xl tracking-tight">CyberLab.Ai</h1>
            <p className="text-[9px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider mt-0.5">SMK AL-AZHAR SEMPU</p>
          </div>
        </div>

        {/* Right Side: Navigation & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
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

          {/* User Info */}
          <div className="flex flex-col items-end border-l pl-2 sm:pl-4 border-gray-200 justify-center">
            <span className="text-xs sm:text-sm font-bold text-gray-700 max-w-[85px] sm:max-w-[150px] truncate leading-tight">
              {user.name}
            </span>
            {/* Hide Grade on Mobile to save vertical space */}
            <span className="hidden sm:inline-block text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-0.5">
              {user.grade}
            </span>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:bg-red-100 flex-shrink-0"
            title="Keluar"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;