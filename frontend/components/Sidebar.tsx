import React from 'react';

const faculty = [
  { id: 'aryan', name: 'Prof. Aryan', role: 'Career Architect', bio: 'Expert in SDE & AI Placement Preparation' },
  { id: 'marcus', name: 'Auditor Marcus', role: 'ATS Compliance Lead', bio: 'Specialist in Resume Parsing Algorithms & Hiring Patterns' },
  { id: 'vikram', name: 'Coach Vikram', role: 'Technical Trainer', bio: 'Full-Stack & System Design Specialist' },
  { id: 'meera', name: 'Ms. Meera', role: 'Aptitude Trainer', bio: 'Quantitative & Logical Reasoning Expert' },
  { id: 'rohan', name: 'Mr. Rohan', role: 'Soft Skills Trainer', bio: 'Interview & Communication Coach' },
  { id: 'zara', name: 'Ms. Zara', role: 'Verbal Coach', bio: 'GRE/IELTS & English Fluency Trainer' },
];

interface SidebarProps {
  sessions: any[];
  currentSessionId: string;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  activeAgent: string;
}

export default function Sidebar({ sessions, currentSessionId, onSessionSelect, onNewSession, activeAgent }: SidebarProps) {
  // Current-ah entha agent workspace open-la iruko avunga details mattum edukkurom
  const currentAgent = faculty.find(a => a.id === activeAgent) || faculty[0];

  return (
    <div className="w-72 bg-[#0a0a0a] h-screen flex flex-col border-r border-white/5 p-6 shrink-0 overflow-hidden">
      
      {/* 1. App Logo & Small Dashboard Nav */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-black text-blue-500 tracking-tighter mb-4 italic">CAMPUSAURA AI</h1>
        <button className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]">
           <span className="text-lg leading-none">⊞</span> Dashboard
        </button>
      </div>

      <hr className="border-white/5 mb-8" />

      {/* 2. Active Agent Profile Area (Photo space + Details) */}
      <div className="mb-10 px-2">
        {/* Profile Photo Placeholder - Automatically picks initials */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mb-5 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-blue-500/20">
          {currentAgent.name.split(' ')[1]?.[0] || currentAgent.name[0]} 
        </div>
        
        <h2 className="text-white font-bold text-lg leading-tight mb-1">{currentAgent.name}</h2>
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{currentAgent.role}</p>
        <p className="text-gray-500 text-[11px] leading-relaxed font-medium">
          {currentAgent.bio}
        </p>
      </div>

      <hr className="border-white/5 mb-8" />

      {/* 3. Chat History Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">History</h3>
          {/* New Chat (+) Icon */}
          <button 
            onClick={onNewSession}
            className="w-8 h-8 flex items-center justify-center bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-black rounded-lg transition-all border border-blue-500/20 shadow-lg shadow-blue-500/5"
            title="Start New Chat"
          >
            <span className="text-xl font-light leading-none">+</span>
          </button>
        </div>

        {/* Scrollable List of Chats */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
          {sessions && sessions.length > 0 ? (
            sessions.map((session: any) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`w-full text-left px-4 py-4 rounded-2xl transition-all duration-300 border ${
                  currentSessionId === session.id 
                    ? 'bg-white/5 border-white/10 text-white shadow-xl ring-1 ring-white/5' 
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Active Indicator Dot */}
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentSessionId === session.id ? 'bg-blue-500 animate-pulse' : 'bg-gray-800'
                  }`} />
                  <p className="text-[11px] truncate font-bold uppercase tracking-tight">
                    {session.title || `Untitled Session`}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-10 px-2 text-center opacity-20">
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] italic leading-loose">
                 No conversations <br/> with this mentor
               </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section - Clean & Minimal */}
      <div className="mt-auto pt-6 border-t border-white/5 opacity-50">
        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest text-center">
          CampusAura AI © 2026
        </p>
      </div>
    </div>
  );
}