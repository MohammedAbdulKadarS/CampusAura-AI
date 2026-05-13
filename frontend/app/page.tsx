'use client';
import { useState, useEffect } from 'react';
import Workspace from '../components/Workspace';

export default function Home() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // --- 1. MOUNT & INITIAL LOAD ---
  useEffect(() => {
    setIsMounted(true);
    // Check if user was already in a session
    const savedAgent = localStorage.getItem('activeAgent');
    if (savedAgent && savedAgent !== "undefined") {
      try {
        setSelectedAgent(JSON.parse(savedAgent));
        setShowWorkspace(true);
      } catch (e) {
        console.error("Local storage error", e);
      }
    }
  }, []);

  // --- 2. HANDLERS ---
  const enterChatroom = (agent: any) => {
    localStorage.setItem('activeAgent', JSON.stringify(agent));
    setSelectedAgent(agent);
    setShowWorkspace(true);
  };

  const handleBack = () => {
    localStorage.removeItem('activeAgent');
    setShowWorkspace(false);
    setSelectedAgent(null);
  };

  // Safety Switch for Hydration
  if (!isMounted) return null;

  // --- 3. WORKSPACE VIEW (FULL SCREEN CLEAN LAYOUT) ---
  if (showWorkspace && selectedAgent) {
    return (
      <div className="h-screen w-full bg-black">
        {/* WORKSPACE-KULLA SIDEBAR AUTOMATIC-AH IRUKKUM */}
        <Workspace 
          agentData={selectedAgent} 
          onBack={handleBack} 
          onMessageSent={() => {}} 
        />
      </div>
    );
  }

  // --- 4. LANDING PAGE VIEW (Marcus Added Here) ---
  const agents = [
    { id: 'aryan', name: 'Prof. Aryan', role: 'Career Architect', specialty: 'Placement Strategy' },
    { id: 'marcus', name: 'Auditor Marcus', role: 'ATS Compliance Lead', specialty: 'Resume Intelligence' },
    { id: 'vikram', name: 'Coach Vikram', role: 'Technical Trainer', specialty: 'Coding & Tech' },
    { id: 'meera', name: 'Ms. Meera', role: 'Aptitude Trainer', specialty: 'Aptitude & Reasoning' },
    { id: 'rohan', name: 'Mr. Rohan', role: 'Soft Skills Trainer', specialty: 'Interviews' },
    { id: 'zara', name: 'Ms. Zara', role: 'Verbal Coach', specialty: 'English & Verbal' },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/5 bg-black/40 p-6 flex justify-between items-center px-12">
        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic">
          CAMPUSAURA AI
        </h1>
        <div className="flex gap-4">
          <button className="px-6 py-2 rounded-full border border-white/10 text-sm font-bold hover:bg-white/5 transition">LOGIN</button>
          <button className="px-6 py-2 rounded-full bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20">GET STARTED</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 flex flex-col items-center text-center">
        <div className="absolute top-20 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full -z-10"></div>
        <h2 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
          CRACK YOUR <br /> <span className="text-cyan-400 underline decoration-white/10 italic">DREAM PLACEMENT</span>
        </h2>
        <p className="max-w-2xl text-gray-400 text-lg md:text-xl mb-12 font-medium leading-relaxed">
          Your AI-powered placement ecosystem. From personalized roadmaps to real-time technical drills, we guide you to high-package roles.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {['AI Resume Audit', 'Mock Interviews', '24/7 Tech Mentors', '6-Month Roadmap'].map((feat) => (
            <span key={feat} className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-gray-500 uppercase">
              {feat}
            </span>
          ))}
        </div>
      </section>

      {/* Agents Section */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="mb-16">
          <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.4em] mb-4">The Faculty</h3>
          <p className="text-4xl font-bold tracking-tight">Choose your training lab</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              onClick={() => enterChatroom(agent)}
              className="group relative bg-gradient-to-b from-[#0a0a0a] to-black border border-white/5 p-10 rounded-[40px] hover:border-cyan-500/50 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl"
            >
              <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center font-black text-xl transition-all duration-500 ${
                agent.id === 'marcus' 
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-black' 
                : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black'
              }`}>
                {agent.name[0]}
              </div>
              <h4 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{agent.name}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">{agent.role}</p>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Master {agent.specialty} with precision drills and real-time AI feedback.</p>
              
              {/* Hover Effect Light */}
              <div className={`absolute -bottom-20 -right-20 w-40 h-40 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                agent.id === 'marcus' ? 'bg-blue-500/10' : 'bg-cyan-500/10'
              }`}></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}