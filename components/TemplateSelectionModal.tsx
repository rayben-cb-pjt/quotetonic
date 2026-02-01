import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuotePreview } from './QuotePreview';
import { AVAILABLE_TEMPLATES, THEME_PRESETS, UI_STRINGS } from '../constants';
import { TemplateId, Language, AppSettings, TutorialLevel } from '../types';
import { X, Check, Palette, Search, Sparkles, Layout, MousePointerClick, ZoomIn, Maximize } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: TemplateId) => void;
  tutorialStep?: number;
  tutorialLevel?: TutorialLevel;
}

const CATEGORIES = [
  { id: 'all', label: { en: 'All Designs', ko: '전체 보기' } },
  { id: 'business', label: { en: 'Business', ko: '비즈니스' } },
  { id: 'creative', label: { en: 'Creative', ko: '크리에이티브' } },
  { id: 'minimal', label: { en: 'Minimal', ko: '미니멀' } },
];

const CATEGORY_MAP: Record<string, string[]> = {
  business: ['standard', 'tech', 'modern', 'midnight'],
  creative: ['bold', 'playful', 'brutalist', 'vogue'],
  minimal: ['minimal', 'elegant', 'eco', 'organic']
};

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen, onClose, onSelect, tutorialStep, tutorialLevel
}) => {
  const { settings, lang } = useSettings();
  const [selectedId, setSelectedId] = useState<TemplateId>('standard');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'fit' | '100%'>('fit');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.55);

  // Safe access with fallback
  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'] || {
    templateSelect: 'Select Template',
    choosePresetLabel: 'Choose Style',
    doubleClickSelect: 'Double Click',
    useThisTheme: 'Use This',
    greatChoice: 'Good Choice',
    viewFit: 'Fit',
    viewScroll: 'Scroll',
    headerPreview: 'Preview'
  } as any;

  // Dynamic Scale Calculation for Modal
  useEffect(() => {
     if (!isOpen || !previewContainerRef.current) return;
     
     const updateScale = () => {
         const { width, height } = previewContainerRef.current!.getBoundingClientRect();
         // Use minimal padding calculation but apply a Safety Multiplier (0.85)
         // 40px horizontal padding, 120px vertical padding (60px top/bottom)
         const availableW = width - 40;
         const availableH = height - 120;
         
         if (availableW <= 0 || availableH <= 0) return;

         const scaleW = availableW / 794;
         const scaleH = availableH / 1123;
         
         // Apply 0.85 safety factor to ensure generous vertical margins
         setFitScale(Math.min(scaleW, scaleH) * 0.85);
     };
     
     const obs = new ResizeObserver(updateScale);
     obs.observe(previewContainerRef.current);
     setTimeout(updateScale, 100);

     return () => obs.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTemplates = AVAILABLE_TEMPLATES.filter(tpl => {
    if (activeCategory === 'all') return true;
    return CATEGORY_MAP[activeCategory]?.includes(tpl.id);
  });

  const selectedTemplate = AVAILABLE_TEMPLATES.find(t => t.id === selectedId);

  // Updated tutorial step check: Step 2 is Template Selection
  const isTutorialActive = (tutorialLevel === 'basic' || !tutorialLevel) && tutorialStep === 2;
  const isStandardSelected = selectedId === 'standard';

  // Paper Dimensions (A4 approx pixels at 96 DPI)
  const PAPER_WIDTH = 794;
  const PAPER_HEIGHT = 1123; 
  
  const currentScale = viewMode === 'fit' ? fitScale : 1.0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-7xl h-[85vh] bg-white rounded-[2rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* Left: Selection Area */}
        <div className="w-full lg:w-[480px] flex flex-col border-r border-slate-100 bg-white z-10">
          {/* Header */}
          <div className="p-8 pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Layout className="text-indigo-600" />
                  {t.templateSelect}
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-medium">{t.choosePresetLabel}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.id 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat.label[lang === 'ko' ? 'ko' : 'en']}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-3">
            {filteredTemplates.map((tpl) => {
              const isTargetTemplate = tpl.id === 'standard';
              const showCardSpotlight = isTutorialActive && isTargetTemplate && !isStandardSelected;
              
              return (
                <div
                  key={tpl.id}
                  data-tutorial-id={showCardSpotlight ? "tutorial-target-standard-tpl" : undefined}
                  onClick={() => setSelectedId(tpl.id)}
                  onDoubleClick={() => onSelect(tpl.id)}
                  className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden select-none ${
                    selectedId === tpl.id 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-600' 
                      : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                  } ${showCardSpotlight ? 'ring-4 ring-indigo-500 ring-offset-2 animate-pulse' : ''}`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                        {tpl.tags[0]}
                        {selectedId === tpl.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>}
                      </div>
                      <h3 className={`text-sm font-black ${selectedId === tpl.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {tpl.name}
                      </h3>
                    </div>
                    {selectedId === tpl.id ? (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg transform scale-100 transition-transform">
                        <Check size={14} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-slate-200 rounded-full group-hover:border-indigo-300 transition-colors"></div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4 opacity-80">
                     <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: THEME_PRESETS[tpl.id].primaryColor }}></div>
                     <div className="h-1.5 w-8 rounded-full border border-slate-200" style={{ backgroundColor: THEME_PRESETS[tpl.id].paperColor }}></div>
                  </div>

                  {selectedId === tpl.id && (
                     <div className="absolute right-4 bottom-4 text-[9px] font-bold text-indigo-500 flex items-center gap-1 animate-in fade-in">
                        <MousePointerClick size={12} /> {t.doubleClickSelect}
                     </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <button
              data-tutorial-id={(isTutorialActive && isStandardSelected) ? "tutorial-target-standard-tpl" : undefined}
              onClick={() => onSelect(selectedId)}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  (isTutorialActive && isStandardSelected)
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 ring-4 ring-indigo-500/30 animate-pulse' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              <Sparkles size={18} />
              {t.useThisTheme}
            </button>
            {(isTutorialActive && isStandardSelected) && (
                <div className="text-center mt-3 text-[10px] text-indigo-600 font-bold animate-bounce">
                    {t.greatChoice}
                </div>
            )}
          </div>
        </div>

        {/* Right: Live Preview Area with View Toggle */}
        <div ref={previewContainerRef} className="hidden lg:flex flex-1 bg-slate-100 relative overflow-hidden flex-col">
           {/* Background Pattern */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#64748b_1px,transparent_1px)] bg-[length:24px_24px]"></div>
           
           {/* View Toggle Bar */}
           <div className="absolute top-6 right-6 z-20 flex bg-white/80 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-1">
               <button 
                  onClick={() => setViewMode('fit')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      viewMode === 'fit' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
               >
                  <Maximize size={14} /> {t.viewFit}
               </button>
               <button 
                  onClick={() => setViewMode('100%')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      viewMode === '100%' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
               >
                  <ZoomIn size={14} /> 100%
               </button>
           </div>

           {/* Preview Floating Label (Sticky not needed if absolute top) */}
           <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 shadow-sm pointer-events-none">
                {t.headerPreview}
           </div>
           
           {/* Content Container */}
           <div className={`w-full h-full custom-scrollbar flex items-center justify-center transition-all ${viewMode === '100%' ? 'overflow-auto items-start justify-center py-20' : 'overflow-hidden'}`}>
              
              {/* Wrapper to hold exact scaled dimensions so flexbox centering works properly */}
              <div 
                 style={{ 
                     width: PAPER_WIDTH * currentScale, 
                     height: PAPER_HEIGHT * currentScale,
                     // Removed transition to match TemplateCustomizer stability update
                 }}
                 className="relative shadow-2xl rounded-sm bg-white"
              >
                  {/* Scaled Content - using transform-origin top-left to fill the wrapper exactly */}
                  <div 
                    style={{ 
                        transform: `scale(${currentScale})`,
                        transformOrigin: 'top left',
                        width: PAPER_WIDTH,
                        height: PAPER_HEIGHT,
                        willChange: 'transform'
                    }}
                  >
                    <QuotePreview 
                      theme={THEME_PRESETS[selectedId]} 
                      settings={settings} 
                      lang={lang} 
                    />
                  </div>

                  {/* Template Info Overlay (Only in fit mode to not block scroll reading) */}
                  {viewMode === 'fit' && (
                    <div className="absolute bottom-8 right-8 pointer-events-none opacity-0 lg:opacity-100 transition-opacity">
                       <div className="px-3 py-1.5 bg-slate-900/10 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded border border-white/20 backdrop-blur-md">
                          {selectedTemplate?.name}
                       </div>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
