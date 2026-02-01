import React, { useEffect, useState, useCallback, useRef } from 'react';
import { UI_STRINGS } from '../constants';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Target, Zap, PlayCircle, Minimize2, Maximize2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTutorial } from '../contexts/TutorialContext';

interface OnboardingGuideProps {
  // No props needed now
}

// Target IDs mapping - Updated to 17 Steps
const STEP_TARGET_IDS = [
  "", // 0: Welcome
  "guide-target-new-btn",         // 1: New Button (Dashboard)
  "tutorial-target-standard-tpl", // 2: Template (Modal)
  "tutorial-target-client-input", // 3: Client (Editor)
  "tutorial-target-ai-input",     // 4: AI Magic Draft (Editor) [NEW]
  "tutorial-target-first-item-desc", // 5: Item (Editor)
  "tutorial-target-preview-btn",  // 6: Preview (Editor)
  "tutorial-target-final-save",   // 7: Save (Editor)
  "tutorial-target-nav-quotes",   // 8: Nav Quotes (Sidebar)
  "tutorial-target-library-filters", // 9: Filters (Library)
  "tutorial-target-nav-templates", // 10: Nav Design (Sidebar)
  "tutorial-target-theme-color",   // 11: Color (Design Center)
  "tutorial-target-nav-settings",  // 12: Nav Settings (Sidebar)
  "tutorial-target-settings-logo", // 13: Logo (Settings)
  "tutorial-target-settings-seal", // 14: Seal (Settings)
  "tutorial-target-settings-canvas", // 15: Canvas (Settings)
  "tutorial-target-settings-save", // 16: Save Settings (Settings)
];

const TOTAL_STEPS = 17;

export const Tutorial: React.FC<OnboardingGuideProps> = () => {
  const { lang } = useSettings();
  const { tutorialStep: step, stopTutorial: onClose, startTutorial: onStart, nextStep: onNext, prevStep: onPrev } = useTutorial();

  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'];
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number; visible: boolean }>({ 
    top: 0, left: 0, width: 0, height: 0, visible: false 
  });
  const [isMinimized, setIsMinimized] = useState(false);
  
  const rafRef = useRef<number | null>(null);

  const updateHighlightPosition = useCallback(() => {
    // Hide highlight on welcome/finish steps
    if (step === 0 || step === TOTAL_STEPS) {
      setTargetRect(prev => prev.visible ? { ...prev, visible: false } : prev);
      return;
    }

    const targetId = STEP_TARGET_IDS[step];
    if (!targetId) {
      setTargetRect(prev => prev.visible ? { ...prev, visible: false } : prev);
      return;
    }

    const element = document.querySelector(`[data-tutorial-id="${targetId}"]`);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const hasDimensions = rect.width > 0 && rect.height > 0;

      if (hasDimensions) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          visible: true
        });
        
        // Auto scroll if element is far off screen
        const margin = 100;
        const isInViewport = 
          rect.top >= margin &&
          rect.bottom <= (window.innerHeight - margin);

        if (!isInViewport) {
           element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }
    } else {
      setTargetRect(prev => prev.visible ? { ...prev, visible: false } : prev);
    }
  }, [step]);

  useEffect(() => {
    const loop = () => {
       updateHighlightPosition();
       rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [updateHighlightPosition]);

  const progress = Math.min(100, Math.round((step / TOTAL_STEPS) * 100));

  // --- RENDER: WELCOME SCREEN (Overlay) ---
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border-4 border-white animate-in zoom-in-95 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-100/50 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 relative shadow-sm border border-rose-100">
             <Sparkles className="text-rose-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 relative">{t.guide_welcome_title}</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed relative">
            {t.guide_welcome_desc}
          </p>
          <div className="space-y-3 relative">
            <button onClick={onStart} className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 hover:scale-[1.02] transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2">
               <PlayCircle size={18} fill="currentColor" className="text-rose-500 bg-white rounded-full"/> 
               {t.guide_start_btn}
            </button>
            <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 py-2">
               {t.guide_skip_btn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: FINISH SCREEN (Overlay) ---
  if (step === TOTAL_STEPS) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border-4 border-white animate-in zoom-in-95 relative overflow-hidden">
           {/* Decorative background circle */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
             <div className="absolute inset-0 bg-emerald-400 rounded-full opacity-20 animate-ping"></div>
             <Target className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 relative">{t.guide_finish}</h2>
          <p className="text-slate-500 text-sm mb-8 relative">
            {t.guide_step17_desc}
          </p>
          <button onClick={onClose} className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 relative">
             {t.guide_finish}
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: FLOATING WIDGET (Main) ---
  const titleKey = `guide_step${step}_title` as keyof typeof t;
  const descKey = `guide_step${step}_desc` as keyof typeof t;
  
  return (
    <>
      {/* 1. Target Highlighter (Non-blocking visual cue) */}
      {targetRect.visible && (
        <div 
          className="fixed pointer-events-none z-[9998] transition-all duration-300 ease-out"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
           {/* Pulsing Border - Rose */}
           <div className="absolute inset-0 rounded-xl border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse"></div>
           
           {/* "Click Here" Indicator - Rose */}
           <div className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-lg animate-bounce">
              <Zap size={14} fill="currentColor" />
           </div>
        </div>
      )}

      {/* 2. Floating Mission Widget */}
      <div className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 flex flex-col items-end ${isMinimized ? 'w-auto' : 'w-80 md:w-96'}`}>
         
         {/* Minimized State Toggle - Rose */}
         {isMinimized ? (
             <button 
                onClick={() => setIsMinimized(false)}
                className="bg-rose-500 text-white p-4 rounded-full shadow-2xl hover:bg-rose-600 hover:scale-110 transition-all flex items-center gap-2 group border-4 border-white"
             >
                <div className="relative">
                   <Target size={24} />
                   <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                   </span>
                </div>
                <span className="font-black text-xs uppercase tracking-widest max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap group-hover:ml-2">
                   Mission Active
                </span>
             </button>
         ) : (
             // UPDATED CONTAINER STYLE: Added border-4 border-white and distinct shadow
             <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border-4 border-white overflow-hidden w-full animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-slate-900/5">
                
                {/* Header - Changed to Rose Gradient for better separation */}
                <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-5 py-4 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      {/* Progress Badge - White bg for contrast on pink header */}
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-md">
                         <span className="font-black text-xs">{Math.round(progress)}%</span>
                      </div>
                      <div>
                         <h3 className="text-white font-bold text-sm drop-shadow-sm">{t.tutorialTitle}</h3>
                         <div className="flex gap-1 mt-1">
                            {Array.from({length: 5}).map((_, i) => (
                               // Progress dots: Active=White, Inactive=White/30
                               <div key={i} className={`h-1 w-4 rounded-full ${i < (step/TOTAL_STEPS)*5 ? 'bg-white' : 'bg-white/30'}`}></div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-2 text-white/80">
                      <button onClick={() => setIsMinimized(true)} className="hover:text-white transition-colors p-1 hover:bg-white/20 rounded-md" aria-label="Minimize">
                         <Minimize2 size={16} />
                      </button>
                      <button onClick={onClose} className="hover:text-white transition-colors p-1 hover:bg-white/20 rounded-md" aria-label="Close Guide">
                         <X size={16} />
                      </button>
                   </div>
                </div>

                {/* Body */}
                <div className="p-5 bg-white relative">
                   {/* Progress Bar Line */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                      <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                   </div>

                   <div className="mb-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">{t.stepLabel} {step}</div>
                      <h4 className="text-lg font-black text-slate-800 mb-1 leading-tight">{t[titleKey]}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{t[descKey]}</p>
                   </div>

                   {/* Step Navigation */}
                   <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                       <button 
                          onClick={onPrev} 
                          disabled={step <= 1}
                          className="text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center gap-1 text-xs font-bold transition-colors"
                       >
                          <ChevronLeft size={14}/> {t.guide_prev}
                       </button>

                       <button 
                          onClick={onNext}
                          className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-rose-200 transition-all active:scale-95 flex items-center gap-2"
                       >
                          {t.guide_next} <ChevronRight size={14}/>
                       </button>
                   </div>
                </div>
                
                {/* Tip/Hint Area */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-start gap-2">
                   <Sparkles size={14} className="text-amber-500 mt-0.5 shrink-0" />
                   <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      Tip: You can move the guide or minimize it if it blocks your view.
                   </p>
                </div>
             </div>
         )}
      </div>
    </>
  );
};
