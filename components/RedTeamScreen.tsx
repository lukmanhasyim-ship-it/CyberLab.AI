
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, RedTeamMission, Achievement } from '../types';
import { generateRedTeamMission } from '../services/geminiService';
import { Terminal, Crosshair, Wifi, ShieldAlert, Play, CheckCircle, XCircle, Loader2, RefreshCw, ChevronDown, Trophy, X, Star } from 'lucide-react';
import FormattedText from './FormattedText';

interface RedTeamScreenProps {
  user: UserProfile;
}

const RT_ACHIEVEMENTS: Achievement[] = [
    { id: 'rt_kiddie', title: 'Script Kiddie', description: 'Menyelesaikan 1 misi', icon: '💻', unlocked: false },
    { id: 'rt_elite', title: 'Elite Hacker', description: 'Menyelesaikan 5 misi', icon: '💀', unlocked: false },
    { id: 'rt_scanner', title: 'Recon Master', description: 'Melakukan scanning Nmap', icon: '📡', unlocked: false },
    { id: 'rt_root', title: 'Rooted', description: 'Mendapatkan akses root/shell', icon: '#', unlocked: false }
];

const RedTeamScreen: React.FC<RedTeamScreenProps> = ({ user }) => {
  const [mission, setMission] = useState<RedTeamMission | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<'BRIEF' | 'SCANNING' | 'ATTACK' | 'SUCCESS' | 'FAIL'>('BRIEF');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [unlockedList, setUnlockedList] = useState<string[]>([]);
  
  // Achievement UI
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{title: string, icon: string} | null>(null);

  // Load Achievements
  useEffect(() => {
     const saved = JSON.parse(localStorage.getItem('achievements_redteam') || '[]');
     setUnlockedList(saved);
  }, []);

  const unlock = (id: string) => {
     if (!unlockedList.includes(id)) {
        const newList = [...unlockedList, id];
        setUnlockedList(newList);
        localStorage.setItem('achievements_redteam', JSON.stringify(newList));
        
        const ach = RT_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
            setAchievementToast({ title: ach.title, icon: ach.icon });
            setTimeout(() => setAchievementToast(null), 3000);
        }
     }
  };

  const loadMission = async () => {
    setLoading(true);
    setMission(null);
    setGameState('BRIEF');
    setConsoleLogs([]);
    setSelectedToolId(null);
    
    const data = await generateRedTeamMission(user);
    setMission(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMission();
  }, []);

  // Auto scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const addLog = (text: string) => {
    setConsoleLogs(prev => [...prev, `root@kali:~# ${text}`]);
  };

  const startScan = () => {
    setGameState('SCANNING');
    setConsoleLogs([]);
    addLog(`nmap -sV ${mission?.targetIp}`);
    
    // Simulate scan delay
    setTimeout(() => {
        if (mission) {
            mission.openPorts.forEach((port, idx) => {
                setTimeout(() => {
                    setConsoleLogs(prev => [...prev, `[+] DISCOVERED OPEN PORT: ${port}`]);
                }, idx * 600);
            });
            setTimeout(() => {
                setGameState('ATTACK');
                setConsoleLogs(prev => [...prev, `[!] SCAN COMPLETE. VULNERABILITY DETECTED.`]);
                unlock('rt_scanner');
            }, mission.openPorts.length * 600 + 1000);
        }
    }, 1000);
  };

  const executeAttack = () => {
    if (!selectedToolId || !mission) return;
    
    const tool = mission.availableTools.find(t => t.id === selectedToolId);
    if (!tool) return;

    addLog(`Starting ${tool.name} against ${mission.targetIp}...`);
    
    setTimeout(() => {
        if (selectedToolId === mission.correctToolId) {
            setGameState('SUCCESS');
            setConsoleLogs(prev => [...prev, `[+] EXPLOIT SUCCESSFUL. SHELL OPENED.`]);
            
            // Save Success
            const current = parseInt(localStorage.getItem('highscore_redteam_missions') || '0');
            const newScore = current + 1;
            localStorage.setItem('highscore_redteam_missions', newScore.toString());
            
            // Unlock Achievements
            unlock('rt_kiddie');
            if (newScore >= 5) unlock('rt_elite');
            unlock('rt_root');

        } else {
            setGameState('FAIL');
            setConsoleLogs(prev => [...prev, `[-] EXPLOIT FAILED. CONNECTION REFUSED.`]);
        }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-140px)] bg-black text-green-500 font-mono">
        <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
            <Loader2 className="w-16 h-16 animate-spin mb-4 relative z-10" />
        </div>
        <p className="text-xl font-bold tracking-widest animate-pulse">ESTABLISHING VPN...</p>
        <p className="text-xs text-green-700 mt-2">Route: 10.10.14.5 -&gt; Target</p>
      </div>
    );
  }

  if (!mission) return null;

  return (
    <div className="h-[calc(100dvh-140px)] md:h-[90vh] bg-black text-green-500 font-mono flex flex-col relative overflow-hidden">
      
      {/* TOAST NOTIFICATION */}
      {achievementToast && (
          <div className="fixed top-24 right-4 z-[100] animate-fade-in-up">
              <div className="bg-emerald-600 rounded-full shadow-2xl border-4 border-emerald-500/50 p-2 pr-8 flex items-center gap-4 max-w-sm transform transition-all hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-inner border-2 border-white/50">
                      <span className="text-2xl drop-shadow-sm">{achievementToast.icon}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                      <h4 className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Yey, kamu mendapatkan Achievement</h4>
                      <span className="text-white font-black text-sm md:text-base leading-none drop-shadow-md">{achievementToast.title}</span>
                  </div>
              </div>
          </div>
      )}

      {/* ACHIEVEMENT MODAL */}
      {showAchievements && (
          <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-green-700 shadow-[0_0_30px_rgba(22,163,74,0.3)] overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
                  <div className="p-4 border-b border-green-900 bg-black flex justify-between items-center">
                      <div className="flex items-center gap-2 text-yellow-500 font-bold">
                          <Trophy className="w-5 h-5" /> ACHIEVEMENTS
                      </div>
                      <button onClick={() => setShowAchievements(false)} className="p-1 hover:bg-zinc-800 rounded-full transition-colors">
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>
                  <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
                      {RT_ACHIEVEMENTS.map((ach) => {
                          const isUnlocked = unlockedList.includes(ach.id);
                          return (
                              <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                  isUnlocked 
                                  ? 'bg-green-900/20 border-green-600/50 shadow-inner' 
                                  : 'bg-black border-zinc-800 opacity-50 grayscale'
                              }`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg' : 'bg-zinc-800 text-slate-600'
                                  }`}>
                                      {ach.icon}
                                  </div>
                                  <div>
                                      <div className={`font-bold text-sm ${isUnlocked ? 'text-green-400' : 'text-slate-500'}`}>{ach.title}</div>
                                      <div className="text-[10px] text-slate-400 leading-tight">{ach.description}</div>
                                  </div>
                                  {isUnlocked && <Star className="w-4 h-4 text-yellow-500 ml-auto" fill="currentColor" />}
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-zinc-900 border-b border-green-900/50 p-3 shrink-0 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
           <Terminal className="w-5 h-5" />
           <span className="font-bold text-sm tracking-widest text-white">RED TEAM OPS</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowAchievements(true)}
                className="p-1.5 rounded bg-black border border-green-900 hover:border-yellow-500 hover:text-yellow-500 transition-colors"
                title="Achievements"
            >
                <Trophy className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-[10px] bg-green-900/30 px-2 py-1 rounded border border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                CONNECTED
            </div>
        </div>
      </div>

      {/* SPLIT LAYOUT (Stacked on Mobile, Row on Desktop) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* TOP/LEFT: TERMINAL (Always Visible) */}
        <div className="flex-1 bg-black/90 p-4 overflow-y-auto border-b md:border-b-0 md:border-r border-green-900/30 shadow-inner">
             {/* TARGET BANNER IN TERMINAL */}
             <div className="mb-4 border border-green-800 rounded p-2 text-xs opacity-70">
                <div>TARGET: <span className="text-white">{mission.targetIp}</span></div>
                <div>OS: {mission.os}</div>
             </div>

             <div className="space-y-2 text-sm">
                <div className="text-slate-500">Kali Linux Rolling [Version 2025.1]</div>
                {consoleLogs.map((log, idx) => (
                    <div key={idx} className="break-all animate-fade-in">{log}</div>
                ))}
                <div ref={consoleEndRef} />
             </div>
        </div>

        {/* BOTTOM/RIGHT: INTERACTION PANEL */}
        <div className="h-auto md:w-96 bg-zinc-900 border-t md:border-t-0 md:border-l border-green-900 p-4 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            
            {/* BRIEF STAGE */}
            {gameState === 'BRIEF' && (
                <div className="flex-1 flex flex-col animate-fade-in">
                    <div className="flex items-center gap-2 text-green-400 font-bold mb-3">
                        <Crosshair className="w-5 h-5" /> MISSION BRIEF
                    </div>
                    <div className="bg-black p-3 rounded border border-green-800 text-xs text-green-300 leading-relaxed mb-4 flex-1 overflow-y-auto">
                        <FormattedText text={mission.description} />
                    </div>
                    <button 
                        onClick={startScan}
                        className="w-full py-4 bg-green-700 hover:bg-green-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-900/20"
                    >
                        <Wifi className="w-5 h-5" /> START NMAP SCAN
                    </button>
                </div>
            )}

            {/* SCANNING STAGE */}
            {gameState === 'SCANNING' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-pulse">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-500" />
                    <p className="text-sm font-bold">SCANNING NETWORK...</p>
                    <p className="text-xs text-green-700 mt-2">Please wait</p>
                </div>
            )}

            {/* ATTACK STAGE */}
            {gameState === 'ATTACK' && (
                <div className="flex-1 flex flex-col animate-fade-in-up">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-3">
                        <ShieldAlert className="w-5 h-5" /> SELECT EXPLOIT
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                        {mission.availableTools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedToolId(tool.id)}
                                className={`w-full p-3 text-left border rounded-xl transition-all ${
                                    selectedToolId === tool.id 
                                    ? 'bg-green-900/50 border-green-400 text-white shadow-md' 
                                    : 'bg-black border-green-900 text-green-600 opacity-80'
                                }`}
                            >
                                <div className="font-bold text-sm mb-0.5">{tool.name}</div>
                                <div className="text-[10px] opacity-70">{tool.description}</div>
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={executeAttack}
                        disabled={!selectedToolId}
                        className="w-full py-4 bg-red-600 hover:bg-red-50 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                    >
                        <Play className="w-5 h-5" /> LAUNCH ATTACK
                    </button>
                </div>
            )}

            {/* RESULT STAGE */}
            {(gameState === 'SUCCESS' || gameState === 'FAIL') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
                    {gameState === 'SUCCESS' ? (
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                    ) : (
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    )}
                    
                    <h2 className={`text-2xl font-bold mb-2 ${gameState === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}>
                        {gameState === 'SUCCESS' ? 'PWNED!' : 'FAILED'}
                    </h2>
                    
                    <p className="text-xs text-white mb-6 max-w-xs leading-relaxed bg-black/50 p-3 rounded border border-green-900">
                        {gameState === 'SUCCESS' ? mission.successMessage : mission.failureMessage}
                    </p>

                    <button 
                        onClick={loadMission}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" /> NEW TARGET
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RedTeamScreen;
