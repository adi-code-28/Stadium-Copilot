import React, { useCallback, useEffect, useState } from 'react';
import { 
  Languages, Globe, BookOpen, Volume2, Mic, 
  Smartphone, Award 
} from 'lucide-react';
import { CULTURAL_BRIEFS } from '../mockData';
import { callGemini, TRANSLATE_AGENT_PROMPT } from '../geminiApi';

export default function VolunteerApp({ apiKey, addToast }) {
  const [selectedLang, setSelectedLang] = useState('Korean');
  const [inputText, setInputText] = useState('Please prepare your ticket for scanning.');
  const [translationResult, setTranslationResult] = useState('');
  const [etiquetteBrief, setEtiquetteBrief] = useState('');
  const [loading, setLoading] = useState(false);

  // Run translation
  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    if (apiKey) {
      try {
        const userPrompt = `Target Language: ${selectedLang}. Phrase: "${inputText}".`;
        const response = await callGemini(TRANSLATE_AGENT_PROMPT, userPrompt, apiKey, true);
        if (response && response.translation) {
          setTranslationResult(response.translation);
          setEtiquetteBrief(response.etiquette || 'Maintain respectful boundaries and professional composure.');
          setLoading(false);
          addToast('Volunteer Speech translated live (Gemini AI)', 'success');
          return;
        }
      } catch (e) {
        console.error(e);
        addToast('Translation service error, reverting to local handbook', 'warning');
      }
    }

    // Offline / Mock Fallback
    setTimeout(() => {
      const brief = CULTURAL_BRIEFS[selectedLang];
      let translated = 'Translation not found in handbook. Speak slowly and use hand signs.';
      
      const inputLower = inputText.toLowerCase();
      if (inputLower.includes('ticket') || inputLower.includes('scan')) {
        translated = brief?.ticket || 'Please prepare your ticket.';
      } else if (inputLower.includes('water') || inputLower.includes('hydrate') || inputLower.includes('heat')) {
        translated = brief?.water || 'Please drink water. It is very hot.';
      } else if (inputLower.includes('medical') || inputLower.includes('help') || inputLower.includes('medic')) {
        translated = brief?.help || 'Medical help is coming.';
      } else if (inputLower.includes('shuttle') || inputLower.includes('bus') || inputLower.includes('transit')) {
        translated = brief?.shuttle || 'Shuttle buses are delayed.';
      } else {
        // Welcoming fallback
        translated = brief?.welcome || 'Welcome to MetLife Stadium.';
      }

      setTranslationResult(translated);
      setEtiquetteBrief(brief?.etiquette || 'Maintain standard polite customer greeting etiquette.');
      setLoading(false);
      addToast('Volunteer Speech translated (Offline Handbook)', 'success');
    }, 600);
  }, [inputText, selectedLang, apiKey, addToast]);

  // Run translation on load/lang change
  useEffect(() => {
    handleTranslate();
  }, [selectedLang, handleTranslate]);

  // Audio Playback in destination voice
  const speakTranslation = () => {
    if (!translationResult) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(translationResult);
      
      const voices = window.speechSynthesis.getVoices();
      if (selectedLang === 'Spanish') {
        utterance.voice = voices.find(v => v.lang.startsWith('es')) || null;
        utterance.lang = 'es-ES';
      } else if (selectedLang === 'Portuguese') {
        utterance.voice = voices.find(v => v.lang.startsWith('pt')) || null;
        utterance.lang = 'pt-BR';
      } else if (selectedLang === 'Korean') {
        utterance.voice = voices.find(v => v.lang.startsWith('ko')) || null;
        utterance.lang = 'ko-KR';
      } else if (selectedLang === 'Czech') {
        utterance.voice = voices.find(v => v.lang.startsWith('cs')) || null;
        utterance.lang = 'cs-CZ';
      }

      window.speechSynthesis.speak(utterance);
      addToast('Translation played aloud', 'success');
    } else {
      addToast('Speech synthesis not supported', 'warning');
    }
  };

  return (
    <div className="flex justify-center items-center p-0 md:p-2 w-full h-full">
      
      {/* Heavy-duty, Ruggedized Volunteer Handheld Device Mockup */}
      <div className="w-full md:max-w-[360px] h-[calc(100vh-140px)] md:h-[720px] md:border-[14px] md:border-zinc-800 md:dark:border-zinc-900 md:rounded-[42px] bg-zinc-50 dark:bg-zinc-950 md:shadow-2xl md:relative overflow-hidden flex flex-col">
        
        {/* Device Top Camera/Speaker bar */}
        <div className="hidden md:flex absolute top-0 inset-x-0 h-6 bg-zinc-800 dark:bg-zinc-900 justify-center items-center z-50">
          <div className="w-16 h-3 bg-black rounded-full flex items-center justify-center">
            <span className="w-2 h-1 bg-zinc-800 rounded-full"></span>
          </div>
        </div>

        {/* Handheld App Header */}
        <div className="pt-3.5 md:pt-8 pb-3.5 px-4 bg-emerald-600 text-black font-extrabold flex items-center justify-between shadow-sm select-none">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4.5 h-4.5" />
            <span className="text-xs tracking-wider">COPILOT VOLUNTEER</span>
          </div>
          <span className="text-[9px] font-mono bg-black/10 px-1.5 py-0.5 rounded">
            VOLUNTEER #482
          </span>
        </div>

        {/* Screen Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-zinc-50 dark:bg-zinc-950">
          
          {/* Volunteer Brief Info Card */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
            <Award className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-zinc-950 dark:text-emerald-400">Multilingual Fan Bridge</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                Speak to fans in any of the 48 competing nations. Speech synthesis broadcasts safety directions.
              </p>
            </div>
          </div>

          {/* Translation Config Panel */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5">
            
            {/* Lang Selection */}
            <div>
              <label className="block text-[9px] font-mono font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" /> FAN'S NATIVE LANGUAGE
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Korean', 'Spanish', 'Portuguese', 'Czech'].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`py-1.5 rounded border text-[10px] font-medium font-mono ${
                      selectedLang === lang ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {lang === 'Spanish' ? '🇲🇽 Spanish' : lang === 'Portuguese' ? '🇧🇷 Portuguese' : lang === 'Korean' ? '🇰🇷 Korean' : '🇨🇿 Czech'}
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono font-bold text-zinc-400">VOLUNTEER SPEECH / INPUT</label>
              
              {/* Presets */}
              <div className="flex flex-wrap gap-1 mb-1.5">
                <button 
                  onClick={() => setInputText('Please prepare your ticket for scanning.')}
                  className="text-[9px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500"
                >
                  "Ticket ready"
                </button>
                <button 
                  onClick={() => setInputText('Please drink water. It is extremely hot today.')}
                  className="text-[9px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500"
                >
                  "Drink water"
                </button>
                <button 
                  onClick={() => setInputText('Shuttle buses are delayed. We recommend the train.')}
                  className="text-[9px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500"
                >
                  "Shuttle delay"
                </button>
              </div>

              <div className="relative">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full text-xs bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-zinc-100 h-16 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                />
                <button className="absolute right-2 bottom-3 p-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-emerald-500" title="Trigger microphone simulation">
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button 
              onClick={handleTranslate}
              disabled={loading}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded flex items-center justify-center gap-1.5 text-xs transition-all shadow-sm"
            >
              <Languages className="w-4 h-4" />
              {loading ? 'Translating via Copilot...' : 'Translate & Broadcast'}
            </button>

          </div>

          {/* Translation Result Panel */}
          {translationResult && (
            <div className="bg-zinc-900 text-white rounded-xl p-4 border border-zinc-800 space-y-3.5 shadow-md">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">{selectedLang} TRANSLATION:</span>
                
                {/* Audio Broadcast */}
                <button 
                  onClick={speakTranslation}
                  className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-700"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-mono">PLAY</span>
                </button>
              </div>
              
              <p className="text-xs font-medium font-sans leading-relaxed text-zinc-100">{translationResult}</p>
            </div>
          )}

          {/* Silent Cultural Etiquette brief card */}
          {etiquetteBrief && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-400 p-3.5 rounded-xl space-y-2 relative shadow-inner">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 shrink-0 text-blue-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">SILENT CULTURAL BRIEF:</span>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-800 dark:text-zinc-300 font-sans italic">{etiquetteBrief}</p>
              
              <div className="absolute top-2 right-2 text-[8px] border border-blue-500/30 px-1 rounded uppercase font-mono text-zinc-400">
                Quiet Alert
              </div>
            </div>
          )}

        </div>

        {/* Handheld Device Home Button / Speaker bezel */}
        <div className="hidden md:flex h-10 bg-zinc-800 dark:bg-zinc-900 justify-center items-center border-t border-zinc-700 select-none">
          <button className="w-12 h-1.5 bg-black rounded-full hover:bg-zinc-950 transition-colors"></button>
        </div>

      </div>

    </div>
  );
}
