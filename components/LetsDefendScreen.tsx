
import React, { useState, useEffect } from 'react';
import { UserProfile, SOCAlert, Achievement } from '../types';
import { generateSOCAlert } from '../services/geminiService';
import { Shield, AlertCircle, FileText, Search, Check, X, Loader2, Globe, Server, Activity, Trophy, Star } from 'lucide-react';
import FormattedText from './FormattedText';

interface LetsDefendScreenProps {
  user: UserProfile;
}

const SOC_ACHIEVEMENTS: Achievement[] = [
    { id: 'soc_junior', title: 'Junior Analyst', description: 'Menyelesaikan 1 tiket', icon: '📝', unlocked: false },
    { id: 'soc_expert', title: 'Senior Analyst', description: 'Menyelesaikan 10 tiket', icon: '💼', unlocked: false },
    { id: 'soc_critical', title: 'Critical Save', description: 'Menangani insiden Critical', icon: '🚨', unlocked: false },
    { id: 'soc_clean', title: 'False Alarm', description: 'Mengidentifikasi False Positive', icon: '✅', unlocked: false }
];

const LetsDefendScreen: React.FC<LetsDefendScreenProps> = ({ user }) => {
  const [alert, setAlert] = useState<SOCAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null); // 'ip', 'hash', etc
  const [analysisResult, setAnalysisResult] = useState<{ type: string, result: string } | null>(null);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [unlockedList, setUnlockedList] = useState<string[]>([]);
  
  // Achievement UI
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{title: string, icon: string} | null>(null);

  // Load Achievements
  useEffect(() => {
     const saved = JSON.parse(localStorage.getItem('achievements_soc') || '[]');
     setUnlockedList(saved);
  }, []);

  const unlock = (id: string) => {
     if (!unlockedList.includes(id)) {
        const newList = [...unlockedList, id];
        setUnlockedList(newList);
        localStorage.setItem('achievements_soc', JSON.stringify(newList));
        
        const ach = SOC_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
            setAchievementToast({ title: ach.title, icon: ach.icon });
            setTimeout(() => setAchievementToast(null), 3000);
        }
     }
  };

  const loadScenario = async () => {
    setLoading(true);
    setAlert(null);
    setFeedback(null);
    setAnalysisResult(null);
    const data = await generateSOCAlert(user);
    setAlert(data);
    setLoading(false);
  };

  useEffect(() => {
    loadScenario();
  }, []);

  const handleAnalyze = (type: 'IP' | 'HASH') => {
    setAnalyzing(type);
    setTimeout(() => {
      setAnalyzing(null);
      if (type === 'IP') {
         setAnalysisResult({ 
             type: 'IP REPUTATION', 
             result: alert?.isTruePositive 
                ? 'Malicious (VirusTotal Score: 15/90). Known C2 Server.' 
                : 'Clean. Owned by Google LLC / Microsoft CDN.' 
         });
      } else {
         setAnalysisResult({ 
             type: 'FILE HASH', 
             result: alert?.isTruePositive 
                ? 'Trojan.Win32.Emotet detected.' 
                : 'Hash not found in database. File likely safe/unknown.' 
         });
      }
    }, 1500); // Simulate delay
  };

  const handleDecision = (decision: boolean) => {
    if (!alert) return;
    if (decision === alert.isTruePositive) {
       setFeedback('CORRECT');
       // Save score
       const current = parseInt(localStorage.getItem('highscore_soc_cases') || '0');
       const newScore = current + 1;
       localStorage.setItem('highscore_soc_cases', newScore.toString());

       // Unlock Achievements
       unlock('soc_junior');
       if (newScore >= 10) unlock('soc_expert');
       if (alert.severity === 'Critical') unlock('soc_critical');
       if (!alert.isTruePositive) unlock('soc_clean');

    } else {
       setFeedback('WRONG');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-140px)] bg-slate-100">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Generating Incident Ticket...</p>
      </div>
    );
  }

  if (!alert) return null;

  return (
    <div className="h-[calc(100dvh-140px)] md:h-[90vh] bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans border-t border-gray-200 relative">
      
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
          <div className="absolute inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-blue-600 font-bold">
                          <Trophy className="w-5 h-5" /> ACHIEVEMENTS
                      </div>
                      <button onClick={() => setShowAchievements(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-500" />
                      </button>
                  </div>
                  <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
                      {SOC_ACHIEVEMENTS.map((ach) => {
                          const isUnlocked = unlockedList.includes(ach.id);
                          return (
                              <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                  isUnlocked 
                                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                  : 'bg-gray-50 border-gray-100 opacity-50 grayscale'
                              }`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
                                  }`}>
                                      {ach.icon}
                                  </div>
                                  <div>
                                      <div className={`font-bold text-sm ${isUnlocked ? 'text-blue-700' : 'text-gray-500'}`}>{ach.title}</div>
                                      <div className="text-[10px] text-gray-500 leading-tight">{ach.description}</div>
                                  </div>
                                  {isUnlocked && <Star className="w-4 h-4 text-yellow-500 ml-auto" fill="currentColor" />}
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 p-4 flex flex-col gap-4">
         <div className="flex items-center justify-between text-white font-bold text-lg mb-2">
            <div className="flex items-center gap-2"><Shield className="w-6 h-6 text-blue-500" /> LetsDefend</div>
            <button 
                onClick={() => setShowAchievements(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Achievements"
            >
                <Trophy className="w-5 h-5 text-yellow-500" />
            </button>
         </div>
         
         <div className="space-y-1">
            <div className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-bold flex items-center gap-2">
               <AlertCircle className="w-4 h-4" /> Active Incidents
            </div>
            <div className="px-3 py-2 hover:bg-slate-800 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors">
               <Activity className="w-4 h-4" /> Endpoint Security
            </div>
            <div className="px-3 py-2 hover:bg-slate-800 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors">
               <Globe className="w-4 h-4" /> Threat Intel
            </div>
         </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
         
         {/* TICKET HEADER */}
         <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      alert.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                      {alert.severity}
                  </span>
                  <span className="text-gray-400 text-xs">ID: {alert.id || '#SOC-2025-001'}</span>
               </div>
               <h2 className="text-2xl font-bold text-gray-800">{alert.title}</h2>
               <p className="text-gray-500 text-sm mt-1">{alert.timestamp}</p>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* ALERT DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                     <Server className="w-4 h-4" /> Source & Dest
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <div className="text-xs text-gray-400 mb-1">Source IP</div>
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                           <code className="text-sm font-mono text-gray-700">{alert.sourceIp}</code>
                           <button 
                             onClick={() => handleAnalyze('IP')}
                             disabled={analyzing !== null}
                             className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-bold"
                           >
                              {analyzing === 'IP' ? 'Checking...' : 'Check Rep'}
                           </button>
                        </div>
                     </div>
                     <div>
                        <div className="text-xs text-gray-400 mb-1">Destination IP</div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                           <code className="text-sm font-mono text-gray-700">{alert.destinationIp}</code>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Artifacts
                  </h3>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">File Hash (MD5/SHA256)</div>
                     {alert.hash ? (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                            <code className="text-xs font-mono text-gray-700 break-all">{alert.hash}</code>
                            <button 
                                onClick={() => handleAnalyze('HASH')}
                                disabled={analyzing !== null}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-bold whitespace-nowrap ml-2"
                            >
                                {analyzing === 'HASH' ? 'Scanning...' : 'VirusTotal'}
                            </button>
                        </div>
                     ) : (
                        <div className="text-sm text-gray-400 italic">No file hash available.</div>
                     )}
                  </div>
               </div>
            </div>

            {/* RAW LOGS */}
            <div className="bg-slate-900 text-slate-300 p-5 rounded-xl mb-8 font-mono text-xs overflow-x-auto shadow-inner">
               <div className="mb-2 text-slate-500 font-bold uppercase">Raw Log Payload</div>
               <div className="whitespace-pre-wrap">{alert.logPayload}</div>
            </div>

            {/* ANALYSIS RESULT POPUP */}
            {analysisResult && (
               <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 animate-fade-in rounded-r-lg">
                  <h4 className="font-bold text-blue-800 text-sm mb-1">{analysisResult.type}</h4>
                  <p className="text-blue-900 text-sm">{analysisResult.result}</p>
               </div>
            )}

            {/* DECISION AREA */}
            {feedback ? (
               <div className={`p-6 rounded-xl text-center animate-fade-in-up ${
                   feedback === 'CORRECT' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
               }`}>
                  {feedback === 'CORRECT' ? (
                     <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  ) : (
                     <X className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  )}
                  
                  <h3 className={`text-xl font-bold mb-2 ${feedback === 'CORRECT' ? 'text-green-800' : 'text-red-800'}`}>
                     {feedback === 'CORRECT' ? 'Excellent Analysis!' : 'Incorrect Decision'}
                  </h3>
                  
                  <div className="text-left bg-white/50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed mb-4">
                     <strong className="block mb-1">Explanation:</strong>
                     <FormattedText text={alert.analysisReport} />
                  </div>

                  <button 
                    onClick={loadScenario}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                  >
                     Next Ticket
                  </button>
               </div>
            ) : (
               <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-gray-200 pt-6">
                  <div className="text-sm text-gray-500 self-center sm:mr-auto">Based on logs & analysis, take action:</div>
                  
                  <button 
                     onClick={() => handleDecision(false)}
                     className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                     <Check className="w-4 h-4" /> False Positive
                  </button>
                  
                  <button 
                     onClick={() => handleDecision(true)}
                     className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                     <AlertCircle className="w-4 h-4" /> True Positive (Escalate)
                  </button>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default LetsDefendScreen;
