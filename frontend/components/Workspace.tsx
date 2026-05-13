'use client';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import Sidebar from './Sidebar';

interface Message {
  sender: string;
  text: string;
}

// 🌐 Dynamic API URL Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campusaura-api.onrender.com';

export default function Workspace({ agentData, onBack, onMessageSent }: { agentData: any, onBack: () => void, onMessageSent: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  // 1. Session ID State - LocalStorage-la agent wise save panrom
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`lastSession_${agentData.id}`);
      return saved || `session_${agentData.id}_${uuidv4().slice(0, 8)}`;
    }
    return `session_${agentData.id}`;
  });

  // 2. Sidebar Sessions Fetch Logic
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/1/${agentData.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Sessions fetch error machan!", error);
    }
  }, [agentData.id]);

  // 3. History Fetching Logic
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/1/${agentData.id}?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("History fetch error!", error);
      setMessages([]); // Error vandha clean pannidalaam
    }
  }, [agentData.id, sessionId]);

  // 4. Initial Load & Sync
  useEffect(() => {
    if (agentData.id) {
      fetchSessions();
      fetchHistory();
    }
  }, [agentData.id, sessionId, fetchSessions, fetchHistory]);

  // 5. Start New Session
  const startNewSession = () => {
    const newId = `session_${agentData.id}_${uuidv4().slice(0, 8)}`;
    setMessages([]);
    setSessionId(newId);
    localStorage.setItem(`lastSession_${agentData.id}`, newId);
    fetchSessions();
  };

  // 6. Session Change Handler
  const handleSessionSelect = (id: string) => {
    setSessionId(id);
    localStorage.setItem(`lastSession_${agentData.id}`, id);
  };

  // 🛠️ PDF Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTyping(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
           setInput(`AUDIT MY RESUME CONTENT:\n\n${data.text}`);
        } else {
           alert(data.error || "PDF empty-ah irukku machan.");
        }
      } else {
        alert("Machan, PDF upload-la issue. Manual-ah text copy panni podu.");
      }
    } catch (error) {
      console.error("Upload error!", error);
    } finally {
      setIsTyping(false);
      e.target.value = '';
    }
  };

  // 7. Send Message Logic
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    const currentSessionId = sessionId;
    
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          agent_id: agentData.id,
          message: currentInput,
          session_id: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
        
        // Refresh sessions to show new title in sidebar
        fetchSessions();
        if (onMessageSent) onMessageSent();
      }
    } catch (error) {
      console.error("Chat error!", error);
      setMessages(prev => [...prev, { sender: 'ai', text: "Server-kooda pesa mudila machan. Render wake-up aaga 50s aagalam, oru 1 min kazhichu try pannu!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      
      <Sidebar 
        sessions={sessions}
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={startNewSession}
        activeAgent={agentData.id}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="p-8 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-black/20">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition text-gray-500 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{agentData.name}</h2>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Session Active</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center opacity-20">
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.5em] leading-loose">
                CampusAura AI <br/> Connection Established
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-6 rounded-[28px] text-sm leading-relaxed ${
                    msg.sender === 'user' 
                    ? 'bg-blue-600 text-white font-bold shadow-2xl shadow-blue-600/10' 
                    : 'bg-[#111] border border-white/5 text-gray-200 shadow-black shadow-lg'
                  }`}>
                    <div className="gemini-content prose prose-invert max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <p className="text-[10px] text-blue-500 animate-pulse font-black uppercase tracking-widest px-4">
                  {agentData.name} is thinking...
                </p>
              )}
            </>
          )}
        </div>

        <div className="p-12">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative bg-[#0f0f0f] border border-white/10 rounded-[32px] p-2 flex items-center shadow-2xl focus-within:border-blue-500/50 transition-all">
              <input 
                type="file" 
                id="resume-upload" 
                className="hidden" 
                accept=".pdf" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => document.getElementById('resume-upload')?.click()}
                className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-cyan-400 transition ml-2 hover:bg-white/5 rounded-full"
                title="Upload Resume PDF"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>

              <textarea 
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder={`Consult with ${agentData.name}...`}
                className="flex-1 bg-transparent border-none px-6 py-5 text-gray-200 placeholder:text-gray-700 focus:outline-none resize-none font-medium"
              />
              <button 
                onClick={sendMessage}
                className="bg-blue-600 text-white h-14 px-10 rounded-[24px] font-black text-xs tracking-widest hover:bg-blue-500 transition-all uppercase"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}