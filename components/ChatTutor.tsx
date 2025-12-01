import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import FormattedText from './FormattedText';

interface ChatTutorProps {
  user: UserProfile;
}

const ChatTutor: React.FC<ChatTutorProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Halo ${user.name}! Saya siap membantumu belajar pelajaran ${user.grade} hari ini. Mau bahas topik apa?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Get response from Gemini
    const responseText = await sendMessageToGemini(messages, input, user);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    // Mobile: Height = 100dvh (dynamic viewport) - Header (~65px) - BottomNav (~80px) = ~145px
    // Desktop: Height = 100vh - Header (~80px)
    <div className="flex flex-col h-[calc(100dvh-145px)] md:h-[calc(100vh-80px)] bg-green-50/50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-emerald-600' : 'bg-white border border-gray-200'
            }`}>
              {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-yellow-500" />}
            </div>
            
            <div className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              <FormattedText text={msg.text} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-yellow-500" />
             </div>
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-xs text-gray-500">CyberLab sedang mengetik...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya materi pelajaran..."
            className="flex-1 bg-gray-100 text-gray-800 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all pr-12 text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-90"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;