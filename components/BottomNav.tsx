import React from 'react';
import { Home, BookOpen, MessageCircle, PieChart, Gamepad2 } from 'lucide-react';
import { AppScreen } from '../types';

interface BottomNavProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, setScreen }) => {
  const navItems = [
    { id: AppScreen.DASHBOARD, icon: Home, label: 'Home' },
    { id: AppScreen.LEARN, icon: BookOpen, label: 'Materi' },
    { id: AppScreen.GAME_CENTER, icon: Gamepad2, label: 'Game' },
    { id: AppScreen.CHAT, icon: MessageCircle, label: 'Chat' },
    { id: AppScreen.REPORT, icon: PieChart, label: 'Rapor' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe print:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          // Highlight if current screen is the item, or if item is Game Center and user is playing any game
          const isActive = currentScreen === item.id || 
             (item.id === AppScreen.GAME_CENTER && (
                currentScreen === AppScreen.GAME || 
                currentScreen === AppScreen.GAME_WORD || 
                currentScreen === AppScreen.GAME_DATA_HUNTER || 
                currentScreen === AppScreen.GAME_LETS_DEFEND ||
                currentScreen === AppScreen.GAME_RED_TEAM ||
                currentScreen === AppScreen.GAME_KC7
             ));

          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${
                isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-50 translate-y-[-2px]' : ''}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;