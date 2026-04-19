import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import ChatTutor from './components/ChatTutor';
import QuizGenerator from './components/QuizGenerator';
import ReportScreen from './components/ReportScreen';
import LearningScreen from './components/LearningScreen';
import GameScreen from './components/GameScreen';
import WordGameScreen from './components/WordGameScreen';
import DataHunterScreen from './components/DataHunterScreen';
import LetsDefendScreen from './components/LetsDefendScreen';
import RedTeamScreen from './components/RedTeamScreen';
import KC7Screen from './components/KC7Screen';
import GameCenter from './components/GameCenter';
import BottomNav from './components/BottomNav';
import { UserProfile, AppScreen } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);

  // Restore session from local storage (simple persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('cyberLabUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentScreen(AppScreen.DASHBOARD);
    }
  }, []);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('cyberLabUser', JSON.stringify(profile));
    setCurrentScreen(AppScreen.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cyberLabUser');
    setCurrentScreen(AppScreen.LOGIN);
  };

  const handleHome = () => {
    setCurrentScreen(AppScreen.DASHBOARD);
  };

  const handleReport = () => {
    setCurrentScreen(AppScreen.REPORT);
  }

  const handleLearn = () => {
    setCurrentScreen(AppScreen.LEARN);
  }

  if (!user || currentScreen === AppScreen.LOGIN) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isGameScreen = currentScreen === AppScreen.GAME || 
                       currentScreen === AppScreen.GAME_WORD || 
                       currentScreen === AppScreen.GAME_DATA_HUNTER || 
                       currentScreen === AppScreen.GAME_LETS_DEFEND ||
                       currentScreen === AppScreen.GAME_RED_TEAM ||
                       currentScreen === AppScreen.GAME_KC7 ||
                       currentScreen === AppScreen.GAME_CENTER; // Center is also a "game" screen style

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col relative">
      {/* Global Background Effects for Logged In State (Non-Game) */}
      {!isGameScreen && (
        <div className="fixed inset-0 z-0 pointer-events-none print:hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-60"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
      )}

      {/* Header is hidden in Game Center to give full immersive feel, or we can keep it. Let's keep it but maybe handle back logic */}
      {currentScreen !== AppScreen.GAME_CENTER && (
          <Header 
            user={user} 
            onLogout={handleLogout} 
            onHome={handleHome} 
            onReport={handleReport}
            onLearn={handleLearn}
          />
      )}
      
      {/* Added pb-20 to prevent content from being hidden behind BottomNav on mobile */}
      <main className={`flex-grow relative z-10 transition-opacity duration-300 ease-in-out animate-fade-in ${isGameScreen ? '' : 'pb-24 md:pb-10'} print:pb-0`}>
        {currentScreen === AppScreen.DASHBOARD && (
          <Dashboard user={user} setScreen={setCurrentScreen} />
        )}
        
        {currentScreen === AppScreen.CHAT && (
          <ChatTutor user={user} />
        )}

        {currentScreen === AppScreen.QUIZ && (
          <QuizGenerator user={user} />
        )}

        {currentScreen === AppScreen.REPORT && (
          <ReportScreen user={user} />
        )}

        {currentScreen === AppScreen.LEARN && (
          <LearningScreen user={user} />
        )}

        {currentScreen === AppScreen.GAME_CENTER && (
          <GameCenter user={user} setScreen={setCurrentScreen} />
        )}

        {currentScreen === AppScreen.GAME && (
          <GameScreen user={user} />
        )}

        {currentScreen === AppScreen.GAME_WORD && (
          <WordGameScreen user={user} />
        )}

        {currentScreen === AppScreen.GAME_DATA_HUNTER && (
          <DataHunterScreen user={user} />
        )}

        {currentScreen === AppScreen.GAME_LETS_DEFEND && (
          <LetsDefendScreen user={user} />
        )}

        {currentScreen === AppScreen.GAME_RED_TEAM && (
          <RedTeamScreen user={user} />
        )}

        {currentScreen === AppScreen.GAME_KC7 && (
          <KC7Screen user={user} />
        )}
      </main>

      {!isGameScreen && (
        <footer className="hidden md:block py-6 text-center text-gray-400 text-sm font-medium border-t border-gray-200/50 bg-white/50 backdrop-blur-sm relative z-10 print:hidden">
          © 2025 SMK AL-AZHAR SEMPU
        </footer>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav currentScreen={currentScreen} setScreen={setCurrentScreen} />
    </div>
  );
};

export default App;