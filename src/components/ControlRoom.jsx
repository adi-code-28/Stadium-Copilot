import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, AlertTriangle, Shield, 
  Search, Cpu, Volume2, Users, Thermometer, Info, 
  Send, CheckSquare 
} from 'lucide-react';
import { INCIDENT_SCENARIOS, CANNED_OPS_RESPONSES, CULTURAL_BRIEFS } from '../mockData';
import { callGemini, SIMULATION_AGENT_PROMPT, ORCHESTRATOR_QUERY_PROMPT } from '../geminiApi';

const TEAM_TO_LANG = {
  'Brazil': 'Portuguese',
  'Czech': 'Czech',
  'Korean': 'Korean',
  'Spanish': 'Spanish'
};

export default function ControlRoom({ apiKey, addToast }) {
  // Simulator State
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [simulationScores, setSimulationScores] = useState({ safety: 70, efficiency: 80, security: 85 });
  const [simulationFeed, setSimulationFeed] = useState([]);
  const [simulationLog, setSimulationLog] = useState([]);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [simAnalysis, setSimAnalysis] = useState('');
  const [simulationPrompt, setSimulationPrompt] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  // Reclaim the Seat State
  const [selectedSection, setSelectedSection] = useState('sec-112');
  const [nudges, setNudges] = useState([
    { id: 1, target: 'Section 112 Concourse', text: 'Sunny side cooling: Ambient temp inside bowl has dropped to 28°C. Return to Section 112 to catch the second half kickoff!', time: '14:20' },
    { id: 2, target: 'Gate C Concourse', text: 'Heat advisory: Section 130 concourse is air conditioned and has 0 wait time. Cooling Zone B is 1 min walk away.', time: '14:24' }
  ]);
  const [customNudgeText, setCustomNudgeText] = useState('');

  // Ops Query State
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [querySteps, setQuerySteps] = useState([]);

  // Multilingual Signage State
  const [homeTeam, setHomeTeam] = useState('Brazil');
  const [awayTeam, setAwayTeam] = useState('Czech');
  const [activeSignageLang, setActiveSignageLang] = useState('English');
  const [customAnnouncement, setCustomAnnouncement] = useState('Welcome to MetLife Stadium! Please stay hydrated. Free water at Gate A and C.');

  const feedEndRef = useRef(null);

  // Initialize simulator
  const startSimulation = (scenarioId) => {
    const scenario = INCIDENT_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    setSelectedScenario(scenario);
    setSimulationActive(true);
    setCurrentStageIndex(0);
    setSimulationScores({ safety: 65, efficiency: 75, security: 80 });
    setSimulationFeed(scenario.stages[0].feed);
    setSimulationPrompt(scenario.stages[0].prompt);
    setSimAnalysis(scenario.stages[0].aiAnalysis);
    setCurrentOptions(scenario.stages[0].choices);
    setSimulationLog([{ type: 'system', text: `INCIDENT DECLARED: ${scenario.title}` }, { type: 'system', text: scenario.narrative }]);
    setSimulationCompleted(false);
    addToast('Incident Simulation Started', 'info');
  };

  // Scroll to bottom of simulation feed
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulationFeed, simulationLog]);

  // Execute choice in simulator
  const handleChoiceSelection = async (choice) => {
    setSimLoading(true);
    
    // Apply score changes
    const newSafety = Math.max(0, Math.min(100, simulationScores.safety + (choice.safetyChange || 0)));
    const newEfficiency = Math.max(0, Math.min(100, simulationScores.efficiency + (choice.efficiencyChange || 0)));
    const newSecurity = Math.max(0, Math.min(100, simulationScores.security + (choice.securityChange || 0)));
    
    setSimulationScores({ safety: newSafety, efficiency: newEfficiency, security: newSecurity });
    
    // Log choice result
    setSimulationLog(prev => [
      ...prev,
      { type: 'user', text: `Selected: ${choice.text}` },
      { type: 'outcome', text: choice.resultLog }
    ]);

    const nextStage = currentStageIndex + 1;
    
    // Check if scenario has pre-configured next stage
    if (selectedScenario.stages[nextStage]) {
      const stage = selectedScenario.stages[nextStage];
      setCurrentStageIndex(nextStage);
      setSimulationFeed(prev => [...prev, ...stage.feed]);
      setSimulationPrompt(stage.prompt);
      setSimAnalysis(stage.aiAnalysis);
      setCurrentOptions(stage.choices);
      setSimLoading(false);
    } else {
      // No pre-configured stage. Try live Gemini call if API key present
      if (apiKey) {
        try {
          const userPrompt = `Scenario: ${selectedScenario.title}\nStage completed: ${currentStageIndex}\nSelected action: ${choice.text}\nOutcome: ${choice.resultLog}\nCurrent scores: Safety ${newSafety}, Efficiency ${newEfficiency}, Security ${newSecurity}`;
          const response = await callGemini(SIMULATION_AGENT_PROMPT, userPrompt, apiKey, true);
          
          if (response && response.prompt) {
            setCurrentStageIndex(nextStage);
            setSimulationFeed(prev => [...prev, ...(response.feed || [])]);
            setSimulationPrompt(response.prompt);
            setSimAnalysis(response.aiAnalysis || 'Situation evolving...');
            setCurrentOptions(response.choices || []);
            setSimulationScores({
              safety: Math.max(0, Math.min(100, newSafety + (response.safetyChange || 0))),
              efficiency: Math.max(0, Math.min(100, newEfficiency + (response.efficiencyChange || 0))),
              security: Math.max(0, Math.min(100, newSecurity + (response.securityChange || 0)))
            });
            setSimulationLog(prev => [...prev, { type: 'system', text: 'AI Incident Commander has generated next threat branch.' }]);
          } else {
            endSimulation(newSafety, newEfficiency, newSecurity);
          }
        } catch (e) {
          console.error(e);
          endSimulation(newSafety, newEfficiency, newSecurity);
        }
      } else {
        endSimulation(newSafety, newEfficiency, newSecurity);
      }
      setSimLoading(false);
    }
  };

  const endSimulation = (safety, efficiency, security) => {
    setSimulationCompleted(true);
    setSimulationActive(false);
    
    const finalScore = Math.round((safety + efficiency + security) / 3);
    setSimulationLog(prev => [
      ...prev,
      { type: 'system', text: `SIMULATION CONCLUDED. Final Assessment: Average Readiness score is ${finalScore}%` }
    ]);
    
    // Import confetti dynamically
    import('canvas-confetti').then(confetti => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });
    
    addToast(`Simulation completed! Score: ${finalScore}%`, 'success');
  };

  // Custom nudge creator
  const sendCustomNudge = () => {
    if (!customNudgeText.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setNudges(prev => [
      { id: Date.now(), target: selectedSection === 'sec-112' ? 'Section 112 Concourse' : 'Section 130 Concourse', text: customNudgeText, time: timeStr },
      ...prev
    ]);
    setCustomNudgeText('');
    addToast('AI Personalized Nudge Pushed to Fans', 'success');
  };

  // Run Operations Database Query
  const runOpsQuery = async (queryText) => {
    const query = queryText || queryInput;
    if (!query.trim()) return;

    setQueryLoading(true);
    setQueryResult(null);
    setQuerySteps(['Querying router...', 'Resolving tool triggers...']);

    // Simulate tool execution pipeline
    setTimeout(() => setQuerySteps(prev => [...prev, 'Executing getGateSensors()...']), 400);
    setTimeout(() => setQuerySteps(prev => [...prev, 'Executing getSectionOccupancy()...']), 800);
    setTimeout(() => setQuerySteps(prev => [...prev, 'Synthesizing with Ops knowledge base...']), 1200);

    await new Promise(resolve => setTimeout(resolve, 1600));

    if (apiKey) {
      try {
        const response = await callGemini(ORCHESTRATOR_QUERY_PROMPT, query, apiKey, true);
        if (response) {
          setQueryResult(response);
          setQueryLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
        addToast('Gemini API call failed, falling back to mock pipeline', 'error');
      }
    }

    // Offline / Mock Fallback
    const canned = CANNED_OPS_RESPONSES.find(r => 
      query.toLowerCase().includes(r.query.toLowerCase()) || 
      r.query.toLowerCase().includes(query.toLowerCase())
    );

    if (canned) {
      setQueryResult(canned);
    } else {
      setQueryResult({
        response: `I searched the database for "${query}". I found that Gate C still remains the primary bottleneck with a 28 min wait time. Platform density at the train station has spiked to 3.2 people/m² following the 75th minute wave.`,
        toolsCalled: ['getGateStatus()', 'getNJTransitTrains()'],
        reasoning: 'AI Reasoning: The query does not match standard templates. Generated a contextual query over the active ops DB indicating elevated transit densities post 75\'.',
        chart: {
          type: 'bar',
          labels: ['Gate A', 'Gate B', 'Gate C', 'Gate D'],
          datasets: [{ label: 'Wait Time (Min)', data: [8, 6, 28, 4] }]
        }
      });
    }
    setQueryLoading(false);
  };

  // Text-To-Speech announcement broadcast
  const triggerAudioAnnouncement = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to find a native voice matching the active language
      const voices = window.speechSynthesis.getVoices();
      if (activeSignageLang === 'Spanish') {
        utterance.voice = voices.find(v => v.lang.startsWith('es')) || null;
        utterance.lang = 'es-ES';
      } else if (activeSignageLang === 'Portuguese') {
        utterance.voice = voices.find(v => v.lang.startsWith('pt')) || null;
        utterance.lang = 'pt-BR';
      } else if (activeSignageLang === 'Korean') {
        utterance.voice = voices.find(v => v.lang.startsWith('ko')) || null;
        utterance.lang = 'ko-KR';
      } else {
        utterance.voice = voices.find(v => v.lang.startsWith('en')) || null;
        utterance.lang = 'en-US';
      }
      
      window.speechSynthesis.speak(utterance);
      addToast('Safety announcement broadcasted live', 'success');
    } else {
      addToast('Speech synthesis not supported in this browser', 'warning');
    }
  };

  // Render occupancy sections
  const getSectionColor = (secId, isSelected) => {
    if (isSelected) {
      return 'stroke-blue-500 dark:stroke-blue-400 fill-none';
    }
    if (secId === 'sec-112') return 'stroke-amber-500/90 animate-pulse fill-none';
    if (secId === 'sec-130') return 'stroke-orange-400/90 fill-none';
    return 'stroke-emerald-500/60 fill-none';
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto p-4 md:p-6 pb-20">
      
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Match Status */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 glow-card-blue transition-all duration-300 hover:border-blue-500/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono font-bold text-zinc-400 tracking-widest uppercase mb-0.5">Match Status</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">Brazil vs Morocco</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-mono">Min 68 · 78,320 att.</span>
            </div>
          </div>
        </div>

        {/* Critical Area */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/60 border border-rose-200/50 dark:border-rose-500/10 rounded-2xl p-4 flex items-center gap-3 glow-card-rose transition-all duration-300 hover:border-rose-500/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono font-bold text-zinc-400 tracking-widest uppercase mb-0.5">Critical Area</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">Gate C Concourse</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] text-rose-500 font-mono font-semibold">28m wait · WBGT 31.4°</span>
            </div>
          </div>
        </div>

        {/* Heat Index */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/60 border border-amber-200/50 dark:border-amber-500/10 rounded-2xl p-4 flex items-center gap-3 glow-card-amber transition-all duration-300 hover:border-amber-500/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono font-bold text-zinc-400 tracking-widest uppercase mb-0.5">Heat Index</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">29.5°C WBGT</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-amber-500 font-mono">Nudges Active</span>
            </div>
          </div>
        </div>

        {/* Readiness */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900/60 border border-emerald-200/50 dark:border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 glow-card-emerald transition-all duration-300 hover:border-emerald-500/30">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono font-bold text-zinc-400 tracking-widest uppercase mb-0.5">Readiness Index</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">92% Operational</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-500 font-mono">Perimeter nominal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Incident Simulator & Reclaim the Seat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Module 1: AI Incident Commander (Simulator) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden flex flex-col border border-zinc-200/70 dark:border-white/[0.06] shadow-sm">
          <div className="px-5 py-4 bg-zinc-950 text-white flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white">AI Incident Commander</h2>
                <p className="text-[10px] text-zinc-500 font-mono">Tabletop Crisis Simulator</p>
              </div>
            </div>
            {!simulationActive && !simulationCompleted && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-400 border border-white/[0.06] font-mono">STANDBY</span>
            )}
            {simulationActive && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono animate-pulse flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />LIVE SIM</span>
            )}
            {simulationCompleted && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />COMPLETE</span>
            )}
          </div>

          {!simulationActive && !simulationCompleted ? (
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20">
              <Info className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Select a Matchday Incident Scenario</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1">
                  Rehearse stadium management decisions against high-fidelity, GenAI-simulated crises based on real World Cup event logs.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl mt-4">
                {INCIDENT_SCENARIOS.map(sc => (
                  <button 
                    key={sc.id} 
                    onClick={() => startSimulation(sc.id)}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-left transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
                  >
                    <div className="text-xs font-mono font-bold text-rose-500 tracking-wider uppercase mb-1">{sc.riskLevel} Risk</div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">{sc.title}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal truncate">{sc.location}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 h-[480px]">
              {/* Scores bar */}
              <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 px-4 py-2">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">SAFETY STATUS</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${simulationScores.safety}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{simulationScores.safety}%</span>
                  </div>
                </div>
                <div className="space-y-1 border-x border-zinc-200 dark:border-zinc-800 px-3">
                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">EGRESS EFFICIENCY</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${simulationScores.efficiency}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{simulationScores.efficiency}%</span>
                  </div>
                </div>
                <div className="space-y-1 pl-3">
                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">SEC PERIMETER</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${simulationScores.security}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{simulationScores.security}%</span>
                  </div>
                </div>
              </div>

              {/* Feed Console */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs bg-zinc-950 text-zinc-300 border-b border-zinc-800">
                {simulationLog.map((log, idx) => (
                  <div key={idx} className={`p-2 rounded border ${
                    log.type === 'system' ? 'bg-zinc-900 border-zinc-800 text-emerald-400' :
                    log.type === 'user' ? 'bg-zinc-900/60 border-zinc-800 text-blue-400' :
                    'bg-zinc-900/20 border-zinc-900 text-zinc-300'
                  }`}>
                    {log.type === 'system' && <span className="text-[10px] px-1 bg-emerald-950 text-emerald-400 rounded mr-1">CO-PILOT</span>}
                    {log.type === 'user' && <span className="text-[10px] px-1 bg-blue-950 text-blue-400 rounded mr-1">DECISION</span>}
                    {log.type === 'outcome' && <span className="text-[10px] px-1 bg-zinc-800 text-zinc-400 rounded mr-1">OUTCOME</span>}
                    {log.text}
                  </div>
                ))}
                
                {simulationActive && (
                  <>
                    <div className="h-px bg-zinc-800 my-4"></div>
                    <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                      <div className="text-xs text-rose-400 font-bold mb-1">UNFOLDING SITUATION:</div>
                      <div className="text-zinc-100">{simulationPrompt}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Info className="w-3 h-3"/> AI THREAT ANALYSIS:</div>
                      <div className="text-[11px] bg-zinc-900/40 p-2 rounded text-zinc-300 italic border border-zinc-900">{simAnalysis}</div>
                    </div>
                  </>
                )}
                <div ref={feedEndRef} />
              </div>

              {/* Input Action Choices */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/20">
                {simLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono text-zinc-500">Generating Threat Action Branches...</span>
                  </div>
                ) : simulationActive ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      Select AI-Recommended Action Path:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {currentOptions.map((choice, idx) => (
                        <div key={idx} className="group relative flex flex-col p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/60 hover:shadow-md hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-all duration-200" onClick={() => handleChoiceSelection(choice)}>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm">{String.fromCharCode(65 + idx)}</span>
                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">{choice.text}</div>
                          </div>
                          {choice.reasoning && (
                            <div className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded border border-zinc-100 dark:border-zinc-800/50 group-hover:bg-emerald-50/30 dark:group-hover:bg-emerald-950/10 transition-colors">
                              {choice.reasoning}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-2">
                    <div className="text-xs text-zinc-500 font-mono">Incident Simulation Terminated.</div>
                    <button 
                      onClick={() => { setSelectedScenario(null); setSimulationCompleted(false); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-zinc-700 to-zinc-800 text-white hover:from-zinc-600 hover:to-zinc-700 font-mono text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> RESET SIMULATOR
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Concourse-to-Seat "Reclaim the Seat" Monitor */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-zinc-950 text-white flex items-center gap-2.5 border-b border-white/[0.06]">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Reclaim the Seat</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Concourse Occupancy Monitor</p>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-3.5">
            
            {/* MetLife SVG Stadium Map outline */}
            <div className="bg-zinc-950/50 dark:bg-zinc-950/80 p-4 rounded-xl border border-white/[0.05] flex justify-center items-center hologram-scanline relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 to-transparent pointer-events-none" />
              <svg width="220" height="180" viewBox="0 0 220 180" className="w-full max-w-[200px] relative z-10">
                {/* Stadium Outer Ring */}
                <ellipse cx="110" cy="90" rx="90" ry="70" className="fill-none stroke-zinc-300 dark:stroke-zinc-800" strokeWidth="4" />
                
                {/* Stadium Bowl Internal */}
                <ellipse cx="110" cy="90" rx="60" ry="45" className="fill-none stroke-zinc-400 dark:stroke-zinc-800" strokeWidth="2" />
                
                {/* Sectors */}
                {/* Sector 101 North */}
                <path d="M 80 48 A 60 45 0 0 1 140 48" className={`${getSectionColor('sec-101', selectedSection === 'sec-101')} cursor-pointer transition-all duration-200`} strokeWidth={selectedSection === 'sec-101' ? "24" : "16"} fill="none" onClick={() => setSelectedSection('sec-101')} />
                
                {/* Sector 112 East */}
                <path d="M 148 70 A 60 45 0 0 1 148 110" className={`${getSectionColor('sec-112', selectedSection === 'sec-112')} cursor-pointer transition-all duration-200`} strokeWidth={selectedSection === 'sec-112' ? "24" : "16"} fill="none" onClick={() => setSelectedSection('sec-112')} />
                
                {/* Sector 120 South */}
                <path d="M 140 132 A 60 45 0 0 1 80 132" className={`${getSectionColor('sec-120', selectedSection === 'sec-120')} cursor-pointer transition-all duration-200`} strokeWidth={selectedSection === 'sec-120' ? "24" : "16"} fill="none" onClick={() => setSelectedSection('sec-120')} />
                
                {/* Sector 130 West */}
                <path d="M 72 110 A 60 45 0 0 1 72 70" className={`${getSectionColor('sec-130', selectedSection === 'sec-130')} cursor-pointer transition-all duration-200`} strokeWidth={selectedSection === 'sec-130' ? "24" : "16"} fill="none" onClick={() => setSelectedSection('sec-130')} />
                
                {/* Labels */}
                <text x="110" y="32" fontSize="9" textAnchor="middle" className="font-mono fill-zinc-500 font-bold">101</text>
                <text x="178" y="93" fontSize="9" textAnchor="middle" className="font-mono fill-zinc-500 font-bold">112</text>
                <text x="110" y="157" fontSize="9" textAnchor="middle" className="font-mono fill-zinc-500 font-bold">120</text>
                <text x="42" y="93" fontSize="9" textAnchor="middle" className="font-mono fill-zinc-500 font-bold">130</text>
                
                <text x="110" y="94" fontSize="10" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-600 font-bold font-sans">PITCH</text>
              </svg>
            </div>

            {/* Selected Section Metrics */}
            <div className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50 dark:bg-zinc-900/40 text-xs">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedSection === 'sec-112' ? 'Section 112 (East Stand)' :
                   selectedSection === 'sec-130' ? 'Section 130 (West Stand)' :
                   selectedSection === 'sec-101' ? 'Section 101 (North Stand)' : 'Section 120 (South Stand)'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  selectedSection === 'sec-112' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {selectedSection === 'sec-112' ? '55% Empty' : 'Stable'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="bg-white dark:bg-zinc-950/80 p-2 rounded-lg border border-zinc-200/70 dark:border-white/[0.06]">
                  <div className="text-zinc-400 mb-1">Scanned</div>
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {selectedSection === 'sec-112' ? '1,200' : '1,100'}
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-950/80 p-2 rounded-lg border border-zinc-200/70 dark:border-white/[0.06]">
                  <div className="text-zinc-400 mb-1">Seated</div>
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {selectedSection === 'sec-112' ? '540' : '1,020'}
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-950/80 p-2 rounded-lg border border-zinc-200/70 dark:border-white/[0.06]">
                  <div className="text-zinc-400 mb-1 text-rose-400/80">Lingering</div>
                  <div className="font-bold text-sm text-rose-500">
                    {selectedSection === 'sec-112' ? '660' : '80'}
                  </div>
                </div>
              </div>
              {selectedSection === 'sec-112' && (
                <div className="mt-2.5 text-[10px] text-zinc-500 flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2 py-1.5">
                  <Info className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>AI: lingering in AC concourse to avoid 32.5°C direct sun.</span>
                </div>
              )}
            </div>

            {/* Custom Nudge Broadcaster */}
            <div className="space-y-2 border-t border-zinc-200/60 dark:border-white/[0.05] pt-3.5 flex-1 flex flex-col justify-end">
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Broadcast Personalized Heat Nudge</div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customNudgeText}
                  onChange={(e) => setCustomNudgeText(e.target.value)}
                  placeholder="e.g. Temp dropped in Sec 112. Return now..."
                  className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-zinc-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') sendCustomNudge(); }}
                />
                <button 
                  onClick={sendCustomNudge}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl flex items-center justify-center transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Nudge list */}
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto mt-1">
                {nudges.map(n => (
                  <div key={n.id} className="text-[10px] p-2 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-100 dark:border-white/[0.04] flex justify-between gap-2 items-start font-mono">
                    <div>
                      <span className="text-amber-500 font-bold">[{n.target}]</span> {n.text}
                    </div>
                    <span className="text-zinc-400 shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Second Row: Ops Query & Multilingual Signage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Module 3: Ops Query Panel */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 bg-zinc-950 text-white flex items-center gap-2.5 border-b border-white/[0.06]">
            <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
              <Search className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Explainable Ops Query</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Natural Language to Insight</p>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-4">
            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => runOpsQuery('Which gates have >15 min wait times and rising WBGT?')}
                className="px-3 py-1.5 rounded-full border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50 dark:bg-white/[0.03] hover:border-blue-500/50 hover:bg-blue-500/10 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium"
              >
                {"Which gates have >15 min wait?"}
              </button>
              <button 
                onClick={() => runOpsQuery('Summarize crowd risk in Fan Zone 2.')}
                className="px-3 py-1.5 rounded-full border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50 dark:bg-white/[0.03] hover:border-blue-500/50 hover:bg-blue-500/10 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium"
              >
                "Summarize Fan Zone 2 risk"
              </button>
              <button 
                onClick={() => runOpsQuery('Explain the concourse seat occupancy gap.')}
                className="px-3 py-1.5 rounded-full border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50 dark:bg-white/[0.03] hover:border-blue-500/50 hover:bg-blue-500/10 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium"
              >
                "Why are seats empty?"
              </button>
            </div>

            {/* Input query */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask control room DB: 'Which transit nodes are bottlenecked?'..." 
                className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 focus:border-transparent transition-all placeholder:text-zinc-400 font-medium"
                onKeyDown={(e) => { if (e.key === 'Enter') runOpsQuery(); }}
              />
              <button 
                onClick={() => runOpsQuery()}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 hover:shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
                disabled={queryLoading}
              >
                <Cpu className="w-3.5 h-3.5" /> Ask AI
              </button>
            </div>

            {/* Query loading details */}
            {queryLoading && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-zinc-400">Agent executing orchestrator loop...</span>
                </div>
                <div className="space-y-1 pl-5">
                  {querySteps.map((step, idx) => (
                    <div key={idx} className="text-[9px] font-mono text-zinc-600 dark:text-zinc-500">✔ {step}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Result displaying Markdown, Traces and Charts */}
            {queryResult && !queryLoading && (
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/30 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                <div className="text-xs text-zinc-800 dark:text-zinc-200 font-sans border-b border-zinc-200 dark:border-zinc-800/50 pb-2 leading-relaxed">
                  <span className="font-bold text-blue-500"> stadium-copilot-ops:</span> {queryResult.response}
                </div>

                {/* Simulated Chart visualization */}
                {queryResult.chart && (
                  <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-900">
                    <div className="text-[10px] font-mono text-zinc-400 mb-2 uppercase text-center">{queryResult.chart.datasets[0].label}</div>
                    
                    {queryResult.chart.type === 'bar' && (
                      <div className="space-y-1.5">
                        {queryResult.chart.labels.map((lbl, idx) => {
                          const val = queryResult.chart.datasets[0].data[idx];
                          const maxVal = Math.max(...queryResult.chart.datasets[0].data);
                          const pct = Math.max(8, (val / maxVal) * 100);
                          return (
                            <div key={idx} className="flex items-center text-[10px] font-mono gap-2">
                              <span className="w-16 truncate text-zinc-500 text-right">{lbl}</span>
                              <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-3 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded" 
                                  style={{ width: `${pct}%`, backgroundColor: lbl === 'Gate C' ? '#ef4444' : '#3b82f6' }}
                                ></div>
                              </div>
                              <span className="w-8 font-bold text-zinc-700 dark:text-zinc-300">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {queryResult.chart.type === 'pie' && (
                      <div className="flex items-center justify-around py-1">
                        <div className="flex flex-col gap-1 text-[9px] font-mono">
                          {queryResult.chart.labels.map((lbl, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: idx === 0 ? '#10b981' : '#ef4444' }}></span>
                              <span className="text-zinc-500">{lbl}: {queryResult.chart.datasets[0].data[idx]}</span>
                            </div>
                          ))}
                        </div>
                        <svg width="60" height="60" viewBox="0 0 32 32" className="rotate-[-90deg]">
                          {/* Very simple SVG pie chart slices */}
                          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#ef4444" strokeWidth="32" />
                          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10b981" strokeWidth="32" strokeDasharray="45 100" />
                        </svg>
                      </div>
                    )}

                    {queryResult.chart.type === 'radial' && (
                      <div className="flex gap-4 justify-around py-1.5">
                        {queryResult.chart.labels.map((lbl, idx) => {
                          const val = queryResult.chart.datasets[0].data[idx];
                          return (
                            <div key={idx} className="flex flex-col items-center">
                              <div className="relative w-11 h-11 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  <path className="text-zinc-200 dark:text-zinc-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  <path className="text-amber-500" strokeWidth="3" strokeDasharray={`${val}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <span className="absolute text-[9px] font-bold font-mono">{val}%</span>
                              </div>
                              <span className="text-[9px] text-zinc-500 font-mono mt-1 text-center truncate w-14">{lbl}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Explainable Reasoning Trace */}
                <details className="group border border-zinc-200/70 dark:border-white/[0.06] rounded-xl bg-zinc-50 dark:bg-zinc-950/80 p-2.5 cursor-pointer transition-all">
                  <summary className="text-[10px] font-mono font-bold text-zinc-400 select-none flex items-center justify-between">
                    <span>🔍 VIEW EXPLAINABLE AI TRACE</span>
                    <span className="text-[8px] border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">Toggle</span>
                  </summary>
                  <div className="mt-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 leading-normal border-t border-zinc-200/60 dark:border-white/[0.05] pt-2 space-y-1">
                    <div><span className="font-bold text-zinc-400">TOOLS CALLED:</span> {queryResult.toolsCalled?.join(', ') || 'None'}</div>
                    <div><span className="font-bold text-zinc-400">REASONING TRACE:</span> {queryResult.reasoning}</div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Module 4: Live Multilingual Fan-Zone Signage Generator */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 bg-zinc-950 text-white flex items-center gap-2.5 border-b border-white/[0.06]">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Live Multilingual Signage</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Fan-Zone Message Generator</p>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-4 justify-between">
            {/* Match / Language configuration */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1 font-semibold">SELECT HOME NATION</label>
                <select 
                  value={homeTeam} 
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all font-medium"
                >
                  <option value="Brazil">Brazil (Portuguese)</option>
                  <option value="Czech">Czechia (Czech)</option>
                  <option value="Korean">South Korea (Korean)</option>
                  <option value="Spanish">Mexico (Spanish)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1 font-semibold">SELECT AWAY NATION</label>
                <select 
                  value={awayTeam} 
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all font-medium"
                >
                  <option value="Czech">Czechia (Czech)</option>
                  <option value="Brazil">Brazil (Portuguese)</option>
                  <option value="Korean">South Korea (Korean)</option>
                  <option value="Spanish">Mexico (Spanish)</option>
                </select>
              </div>
            </div>

            {/* Custom announcements draft */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-zinc-400 font-semibold">DRAFT EVENT ADVISORY TEXT</label>
              <textarea 
                value={customAnnouncement}
                onChange={(e) => setCustomAnnouncement(e.target.value)}
                className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 h-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all resize-none placeholder:text-zinc-400 font-medium"
                placeholder="Enter your announcement text here..."
              />
            </div>

            {/* Dynamic Signage Output */}
            <div className="border border-zinc-800 bg-black rounded-lg p-4 font-mono text-center flex flex-col justify-center items-center relative overflow-hidden h-36">
              {/* LED Grid effect overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none"></div>
              
              {/* Language selection tabs inside Signage */}
              <div className="absolute top-2 left-2 flex gap-1 z-10">
                {['English', homeTeam, awayTeam].filter(Boolean).map(lang => (
                  <button 
                    key={lang}
                    onClick={() => setActiveSignageLang(lang)}
                    className={`text-[9px] px-2 py-1 rounded-lg border font-medium transition-all ${
                      activeSignageLang === lang ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {lang === 'Brazil' ? 'POR' : lang === 'Czech' ? 'CZE' : lang === 'Korean' ? 'KOR' : lang === 'Spanish' ? 'ESP' : 'ENG'}
                  </button>
                ))}
              </div>

              {/* The Signage Text */}
              <div className="text-amber-500 font-bold text-xs max-w-xs mt-4 animate-pulse uppercase leading-normal tracking-wide">
                {activeSignageLang === 'English' && customAnnouncement}
                {activeSignageLang === homeTeam && (CULTURAL_BRIEFS[TEAM_TO_LANG[homeTeam]]?.welcome || CULTURAL_BRIEFS[TEAM_TO_LANG[homeTeam]]?.water || customAnnouncement)}
                {activeSignageLang === awayTeam && (CULTURAL_BRIEFS[TEAM_TO_LANG[awayTeam]]?.welcome || CULTURAL_BRIEFS[TEAM_TO_LANG[awayTeam]]?.water || customAnnouncement)}
              </div>

              <div className="absolute bottom-2 right-2 flex gap-2">
                {/* Voice Broadcast Action */}
                <button 
                  onClick={() => {
                    const text = activeSignageLang === 'English' ? customAnnouncement : 
                                 activeSignageLang === homeTeam ? (CULTURAL_BRIEFS[TEAM_TO_LANG[homeTeam]]?.welcome || customAnnouncement) : 
                                 (CULTURAL_BRIEFS[TEAM_TO_LANG[awayTeam]]?.welcome || customAnnouncement);
                    triggerAudioAnnouncement(text);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/40 hover:to-emerald-600/40 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/40 hover:border-emerald-500/60 text-[10px] font-semibold transition-all duration-200"
                  title="Broadcast Voice Audio Signage"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>VOICE BROADCAST</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
