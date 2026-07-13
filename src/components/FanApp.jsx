import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  Compass, Leaf, AlertCircle, MessageSquare, Send, 
  MapPin, AlertTriangle, Navigation, TreePine
} from 'lucide-react';
import { STADIUM_MAP, findPath } from '../mockData';
import { callGemini, HEAT_AGENT_PROMPT } from '../geminiApi';

export default function FanApp({ apiKey, addToast }) {
  const [activeTab, setActiveTab] = useState('wayfinding');
  const chatEndRef = useRef(null);
  
  // Wayfinding states
  const [startPoint, setStartPoint] = useState('gate-a');
  const [endPoint, setEndPoint] = useState('sec-112');
  const [waypointPath, setWaypointPath] = useState([]);

  // Carbon Passport states
  const [travelMode, setTravelMode] = useState('train');
  const [travelDistance, setTravelDistance] = useState(150);
  const [carbonPassport, setCarbonPassport] = useState(null);
  const [passportLoading, setPassportLoading] = useState(false);

  // Heat Risk states
  const [ageGroup, setAgeGroup] = useState('18-64');
  const [healthFlag, setHealthFlag] = useState('none');
  const [heatAdvisory, setHeatAdvisory] = useState({
    message: 'Stay hydrated. The East concourse has high heat exposure. Cooling Zone B is 90s away.',
    reason: 'Standard baseline advisory for high temperature conditions.'
  });
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am your Stadium Copilot. Ask me anything about tickets, rules, directions, or transit.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Scroll to bottom of chat when messages update or tab changes to chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, activeTab]);

  // Calculate wayfinding path
  const handleCalculatePath = useCallback(() => {
    const path = findPath(startPoint, endPoint);
    setWaypointPath(path);
    addToast('Offline wayfinding path generated successfully', 'success');
  }, [startPoint, endPoint, addToast]);

  // Run wayfinding on mount/change
  useEffect(() => {
    handleCalculatePath();
  }, [startPoint, endPoint, handleCalculatePath]);

  // Carbon Passport generation
  const handleCalculateCarbon = () => {
    setPassportLoading(true);
    setTimeout(() => {
      // CO2 factors (kg CO2 per km)
      const factors = { flight: 0.25, rideshare: 0.18, bus: 0.08, train: 0.04 };
      const selectedFactor = factors[travelMode];
      
      const flightEmissions = Math.round(travelDistance * factors.flight);
      const userEmissions = Math.round(travelDistance * selectedFactor);
      const co2Saved = Math.max(0, flightEmissions - userEmissions);
      const equivalentTrees = (co2Saved / 22).toFixed(1); // 1 tree absorbs ~22kg CO2/year
      
      setCarbonPassport({
        distance: travelDistance,
        mode: travelMode,
        emissions: userEmissions,
        saved: co2Saved,
        trees: equivalentTrees,
        grade: co2Saved > 100 ? 'A+' : co2Saved > 50 ? 'A' : co2Saved > 15 ? 'B' : 'C'
      });
      setPassportLoading(false);
      
      // Confetti triggers on successful Carbon Passport generation!
      import('canvas-confetti').then(confetti => {
        confetti.default({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      });
      addToast('Tournament Carbon Passport Generated', 'success');
    }, 800);
  };

  // Generate Personalized Heat Advisory
  const updateHeatAdvisory = useCallback(async () => {
    setAdvisoryLoading(true);
    
    if (apiKey) {
      try {
        const userPrompt = `Fan Profile: Age group: ${ageGroup}, Health flags: ${healthFlag}. Current Weather: 33°C, WBGT 31.4°C (Direct Sun East Stand). Section: 112.`;
        const response = await callGemini(HEAT_AGENT_PROMPT, userPrompt, apiKey, true);
        if (response && response.message) {
          setHeatAdvisory(response);
          setAdvisoryLoading(false);
          addToast('Personalized Heat Risk Profile Updated', 'success');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Local rule-based fallback
    setTimeout(() => {
      let msg = 'Stay hydrated. Avoid direct sun on the East Concourse. Cooling Zone B is 1 min away.';
      let reason = 'Baseline advisory for typical adult.';

      if (ageGroup === '65+' || healthFlag === 'asthma' || healthFlag === 'cardio') {
        msg = '⚠️ HIGH HEAT RISK: Temp is 33°C (WBGT 31.4°C). We highly advise moving to the shaded North/West concourses. Cooling Zone A (Section 101) is air conditioned.';
        reason = 'Clinical Alert: Elevated heat stroke susceptibility due to user profile factors.';
      } else if (healthFlag === 'pregnancy') {
        msg = '⚠️ PREGNANCY HEAT ALERT: Keep hydrated. Restrooms and Cooling Zone B have active misting fans (80m away). Section 120 has shaded seats.';
        reason = 'Safety Alert: Hydration prioritised due to pregnancy indicator.';
      }

      setHeatAdvisory({ message: msg, reason: reason });
      setAdvisoryLoading(false);
      addToast('Personalized Heat Risk Profile Updated (Offline)', 'success');
    }, 600);
  }, [ageGroup, healthFlag, apiKey, addToast]);

  useEffect(() => {
    updateHeatAdvisory();
  }, [ageGroup, healthFlag, updateHeatAdvisory]);

  // Send chatbot query
  const sendChatMessage = async (presetText) => {
    const text = presetText || chatInput;
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    if (apiKey) {
      try {
        const botText = await callGemini(
          "You are Stadium Copilot, an offline-first RAG chat assistant for fans. Answer queries about stadium policies (no water bottles allowed except sealed 500ml, quiet areas in Sec 100, cooling zone location, tickets authentication). Keep it under 2 sentences.",
          text,
          apiKey
        );
        if (botText) {
          setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botText }]);
          setChatLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Offline RAG simulation response
    setTimeout(() => {
      let reply = "I'm searching my stadium handbook... Gate scanner queues are normal except Gate C (28m delay). You can bring one sealed water bottle up to 500ml.";
      
      const queryLower = text.toLowerCase();
      if (queryLower.includes('water') || queryLower.includes('hydration')) {
        reply = "Fans are allowed to bring one factory-sealed plastic water bottle (up to 500ml). Refill stations are located near all Cooling Zones (Sections 101 and 124).";
      } else if (queryLower.includes('quiet') || queryLower.includes('sensory')) {
        reply = "MetLife Stadium has a dedicated Sensory/Quiet Area located behind Section 100. Noise-canceling headphones can be checked out at Guest Services.";
      } else if (queryLower.includes('exit') || queryLower.includes('transit')) {
        reply = "The quietest egress is currently Gate D (West). Avoid Gate C due to scanner bottlenecks. Shuttles are delayed, trains are running every 8 min.";
      } else if (queryLower.includes('ticket') || queryLower.includes('counterfeit') || queryLower.includes('fraud')) {
        reply = "Verify your ticket inside the FIFA app only. Counterfeit tickets are flagged. Do not purchase barcodes shared on messaging platforms.";
      }

      setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply }]);
      setChatLoading(false);
    }, 800);
  };

  return (
    <div className="flex justify-center items-center p-0 md:p-2 w-full h-full">
      
      {/* 3D-effect Sleek Mobile Phone Frame */}
      <div className="w-full md:max-w-[360px] h-[calc(100vh-140px)] md:h-[720px] md:border-[10px] md:border-[#161718] md:rounded-[42px] bg-white dark:bg-[#0a0b0c] md:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] md:relative overflow-hidden flex flex-col phone-shine">
        
        {/* Dynamic Notch / Speaker Grill */}
        <div className="hidden md:flex absolute top-0 inset-x-0 h-6 bg-zinc-900 dark:bg-zinc-800 justify-center items-center z-50">
          <div className="w-20 h-4 bg-black rounded-b-xl flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mr-2"></span>
            <span className="w-10 h-1 bg-zinc-800 rounded-full"></span>
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="pt-3.5 md:pt-8 pb-3 px-4 bg-[#0a0b0c] text-white flex items-center justify-between border-b border-white/[0.06] select-none">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-emerald-500/20">
              <Navigation className="w-3 h-3 text-emerald-400 rotate-45" />
            </div>
            <span className="font-bold text-xs tracking-tight">Stadium Copilot</span>
          </div>
          <span className="text-[9px] font-mono bg-white/[0.06] border border-white/[0.08] px-2 py-1 rounded-full text-zinc-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            METLIFE · 33°C
          </span>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 overflow-y-auto p-3.5 no-scrollbar bg-zinc-50 dark:bg-zinc-950">
          
          {/* Tab 1: Wayfinding */}
          {activeTab === 'wayfinding' && (
            <div className="space-y-3.5">
              <div className="text-xs bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <Compass className="w-4 h-4 text-blue-500" /> Offline Turn-by-Turn Wayfinding
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Navigating 80k-seat stadium bowl offline via IndexedDB cache.</p>
                
                {/* Inputs selectors */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-0.5">START LOCATION</label>
                    <select value={startPoint} onChange={(e) => setStartPoint(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-1">
                      <option value="gate-a">Gate A (North)</option>
                      <option value="gate-b">Gate B (East)</option>
                      <option value="gate-c">Gate C (South)</option>
                      <option value="gate-d">Gate D (West)</option>
                      <option value="rail-station">NJ Transit Train</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-0.5">DESTINATION</label>
                    <select value={endPoint} onChange={(e) => setEndPoint(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-1">
                      <option value="sec-112">Section 112 (My Seat)</option>
                      <option value="sec-120">Section 120 (Seating)</option>
                      <option value="cooling-b">Cooling Zone B</option>
                      <option value="restroom-a">Restroom A</option>
                      <option value="quiet-zone">Quiet Area (Sensory)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Wayfinding Visualizer (SVG Map) */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
                <svg width="250" height="200" viewBox="0 0 500 400" className="w-full">
                  {/* Outer Walls */}
                  <ellipse cx="250" cy="200" rx="220" ry="170" className="fill-none stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="6" />
                  <ellipse cx="250" cy="200" rx="160" ry="120" className="fill-none stroke-zinc-300 dark:stroke-zinc-900" strokeWidth="2" />
                  
                  {/* Nodes rendering */}
                  {Object.values(STADIUM_MAP.nodes).map(node => {
                    const isSelected = startPoint === node.id || endPoint === node.id;
                    const isPathPart = waypointPath.some(n => n.id === node.id);
                    return (
                      <g key={node.id}>
                        <circle 
                          cx={node.x} 
                          cy={node.y} 
                          r={isSelected ? 10 : isPathPart ? 7 : 5}
                          fill={node.color}
                          className={`transition-all ${isSelected ? 'animate-bounce filter drop-shadow' : ''}`}
                        />
                        {/* Short labels for key points */}
                        {(isSelected || node.type === 'gate') && (
                          <text x={node.x} y={node.y - 12} fontSize="12" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-800 dark:text-zinc-200 font-mono">
                            {node.label.split(' ')[0]}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Draw the wayfinding path connection */}
                  {waypointPath.length > 1 && (
                    <path 
                      d={`M ${waypointPath.map(n => `${n.x} ${n.y}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="4" 
                      className="animate-dash" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  )}
                </svg>

                {/* Path directions list */}
                <div className="w-full border-t border-zinc-100 dark:border-zinc-800 mt-3 pt-2 text-[10px] font-mono text-zinc-500">
                  <div className="font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> NAVIGATION INSTRUCTIONS:
                  </div>
                  {waypointPath.length > 1 ? (
                    <div className="space-y-0.5 pl-2 border-l border-emerald-500/30">
                      <div>Start at <span className="font-bold text-zinc-800 dark:text-zinc-200">{waypointPath[0]?.label}</span></div>
                      {waypointPath.slice(1, -1).map((n, i) => (
                        <div key={i}>Pass by {n.label}</div>
                      ))}
                      <div>Arrive at <span className="font-bold text-emerald-500">{waypointPath[waypointPath.length - 1]?.label}</span></div>
                    </div>
                  ) : (
                    <div>Select start and end points to plot routing instructions.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Carbon Passport */}
          {activeTab === 'carbon' && (
            <div className="space-y-4">
              <div className="text-xs bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 text-emerald-500">
                  <Leaf className="w-4 h-4" /> Travel Carbon Passport
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Offsets expanded 48-team flight criticism. Benchmark your green transit.</p>
                
                <div className="space-y-2 mt-3 text-[10px]">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-0.5">TRANSIT MODE</label>
                    <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-1.5">
                      <option value="train">NJ Transit Rail Line</option>
                      <option value="bus">Tournament Shuttle Bus</option>
                      <option value="rideshare">Carpool / Rideshare</option>
                      <option value="flight">Flight (Long Distance)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-0.5">DISTANCE (KM)</label>
                    <input 
                      type="number" 
                      value={travelDistance} 
                      onChange={(e) => setTravelDistance(Math.max(0, Number(e.target.value)))} 
                      className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <button 
                    onClick={handleCalculateCarbon}
                    disabled={passportLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg mt-2 transition-all duration-200 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:shadow-md"
                  >
                    {passportLoading ? 'Calculating footprint...' : 'Generate Carbon Passport'}
                  </button>
                </div>
              </div>

              {/* Passport Card Output */}
              {carbonPassport && (
                <div className="bg-gradient-to-br from-emerald-950 to-zinc-900 text-white rounded-xl p-4 border border-emerald-500/30 shadow-lg relative overflow-hidden font-mono text-[10px] space-y-3.5">
                  <div className="absolute top-2 right-2 text-emerald-400 font-extrabold text-sm border border-emerald-500/40 px-1.5 rounded bg-emerald-950/60">
                    {carbonPassport.grade}
                  </div>
                  <div className="border-b border-emerald-800/50 pb-2">
                    <div className="text-[9px] text-emerald-400 font-extrabold tracking-widest">WORLD CUP 2026</div>
                    <div className="text-sm font-extrabold tracking-tight">GREEN TRANSIT CO2 LOG</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <span className="text-zinc-500">TRAVEL:</span> {carbonPassport.distance} KM via {carbonPassport.mode.toUpperCase()}
                    </div>
                    <div>
                      <span className="text-zinc-500">CO2 EMITTED:</span> {carbonPassport.emissions} KG CO₂
                    </div>
                    <div>
                      <span className="text-zinc-500">SAVED VS FLIGHT:</span> <span className="text-emerald-400 font-bold">-{carbonPassport.saved} KG CO₂</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">TREE EQUIVALENT:</span> {carbonPassport.trees} Trees/Yr
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-800/30 p-2.5 rounded flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-[8px] text-emerald-300 leading-normal">
                      Your eco-choice has offset equivalent of planting {carbonPassport.trees} trees. Share and compare to claim travel discounts at fanshop.
                    </p>
                  </div>

                  <button className="w-full py-1.5 text-center bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/40 hover:to-emerald-600/40 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/40 hover:border-emerald-500/60 text-[9px] font-bold transition-all duration-200">
                    [SHARE ON SOCIAL CARDS]
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Heat Advisory */}
          {activeTab === 'heat' && (
            <div className="space-y-4">
              <div className="text-xs bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="w-4 h-4" /> Personal Heat-Risk Settings
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Tails alerts to your vulnerability profile instead of generic stadium blares.</p>
                
                <div className="space-y-3 mt-3 text-[10px]">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">AGE BRACKET</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['Under 18', '18-64', '65+'].map(age => (
                        <button 
                          key={age}
                          onClick={() => setAgeGroup(age)}
                          className={`py-1.5 px-2 rounded-lg border text-[9px] font-mono font-semibold transition-all duration-200 ${
                            ageGroup === age ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/50 shadow-sm' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/30'
                          }`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">HEALTH & SENSITIVITY FLAGS</label>
                    <select value={healthFlag} onChange={(e) => setHealthFlag(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-1.5">
                      <option value="none">None (Standard Profile)</option>
                      <option value="asthma">Asthma / Respiratory issue</option>
                      <option value="pregnancy">Pregnancy indicator</option>
                      <option value="cardio">Cardiovascular concerns</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Advisory Output */}
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl space-y-3">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold font-mono">TAILORED WEATHER ADVISORY:</div>
                </div>
                {advisoryLoading ? (
                  <div className="text-[10px] font-mono animate-pulse">Re-generating warning threshold via Co-pilot...</div>
                ) : (
                  <p className="text-xs leading-relaxed">{heatAdvisory.message}</p>
                )}
                {heatAdvisory.reason && !advisoryLoading && (
                  <div className="text-[9px] border-t border-amber-500/10 pt-2 font-mono text-zinc-400 italic">
                    AI Reason Trace: {heatAdvisory.reason}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: RAG Chatbot */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[400px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-2 text-[10px] ${
                      msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-2 flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Preset Buttons */}
              <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap gap-1.5">
                <button onClick={() => sendChatMessage('Can I bring water bottle inside?')} className="text-[9px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200">"Bring water?"</button>
                <button onClick={() => sendChatMessage('Where is the quiet sensory zone?')} className="text-[9px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200">"Quiet room?"</button>
                <button onClick={() => sendChatMessage('How to verify ticket authenticity?')} className="text-[9px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200">"Ticket validity?"</button>
              </div>

              {/* Chat Input */}
              <div className="p-2 border-t border-zinc-200 dark:border-zinc-800/80 flex gap-1.5 bg-zinc-50 dark:bg-zinc-950">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a rule, schedule or direction..."
                  className="flex-1 text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                />
                <button 
                  onClick={() => sendChatMessage()}
                  className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg flex items-center justify-center shrink-0 w-8 h-8 transition-all duration-200 shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 hover:shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Mobile App Navigation Footer */}
        <div className="h-16 border-t border-white/[0.05] bg-[#0a0b0c] flex justify-around items-center select-none z-10 shrink-0 px-2">
          {[
            { id: 'wayfinding', label: 'Navigate', icon: Compass },
            { id: 'carbon', label: 'Carbon', icon: Leaf },
            { id: 'heat', label: 'Heat Risk', icon: AlertTriangle },
            { id: 'chat', label: 'Copilot', icon: MessageSquare },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[52px] ${
                  isActive ? 'text-emerald-400' : 'text-zinc-600'
                }`}
              >
                <tab.icon className="w-4.5 h-4.5" />
                <span className="text-[8px] font-medium tracking-wide">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}
