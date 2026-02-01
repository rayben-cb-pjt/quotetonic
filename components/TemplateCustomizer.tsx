import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useQuotes } from '../contexts/QuoteContext';
import { ThemeConfig, TemplateId, FontFamily } from '../types';
import { THEME_PRESETS, AVAILABLE_TEMPLATES, UI_STRINGS } from '../constants';
import { 
    Palette, Layout, Type, Layers, Check, RefreshCcw, Maximize, Scissors, Stamp, 
    Plus, Pipette, FilePlus, AlignCenter, AlignLeft, AlignJustify, AlignRight, 
    Minus, Image, RotateCcw, Sliders, Contrast, Move, Blend, ZoomIn, ZoomOut, ChevronDown, Droplets
} from 'lucide-react';
import { QuotePreview } from './QuotePreview';

export const TemplateCustomizer: React.FC = () => {
  const { settings, updateTheme, updateSettings } = useSettings();
  const { createQuote } = useQuotes();
  const lang = settings.language;
  const currentTheme = settings.theme;

  // Safe access with fallback
  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'] || {
    headerSplit: 'Split',
    headerCentered: 'Center',
    headerBanner: 'Banner',
    headerClean: 'Clean',
    themePresets: 'Presets',
    typography: 'Typography',
    primaryColor: 'Color',
    layoutStructure: 'Layout',
    borderRadius: 'Radius',
    showWatermark: 'Pattern',
    patternBackground: 'Background',
    useThisTheme: 'Use Theme',
    saveGlobalDefault: 'Save Default',
    saveSuccess: 'Saved',
    liveInteractivePreview: 'Preview',
    customColor: 'Custom',
    logoBranding: 'Logo Style',
    logoSize: 'Size',
    logoOpacity: 'Opacity',
    logoPosition: 'Position',
    invertLogo: 'Invert',
    blendMode: 'Blend',
    resetPosition: 'Reset',
    dragHint: 'Drag to move • Drag corner to resize',
    blendNormal: 'Normal',
    blendMultiply: 'Multiply (Remove BG)',
    blendScreen: 'Screen (Brighten)'
  } as any;

  // View Mode for Preview
  const [viewMode, setViewMode] = useState<'fit' | '100%'>('fit');
  const [isBlendDropdownOpen, setIsBlendDropdownOpen] = useState(false);

  // Unified Interaction State (Move or Resize)
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    initialVal1: number; // For move: posX, For resize: size
    initialVal2?: number; // For move: posY
  } | null>(null);

  // Dynamic Scale Calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.45);

  useEffect(() => {
     if (!containerRef.current) return;
     const updateScale = () => {
         const { width, height } = containerRef.current!.getBoundingClientRect();
         
         // Balanced padding: 80px horizontal, 120px vertical
         // This ensures enough space for headers/footers and shadows
         const availableW = width - 80;
         const availableH = height - 120;
         
         if (availableW <= 0 || availableH <= 0) return;

         const scaleW = availableW / 794;
         const scaleH = availableH / 1123;
         
         // Use 0.85 multiplier - The sweet spot between "Too Small" (0.75) and "Cut Off" (0.94)
         setFitScale(Math.min(scaleW, scaleH) * 0.85);
     };
     
     const obs = new ResizeObserver(updateScale);
     obs.observe(containerRef.current);
     setTimeout(updateScale, 50);

     return () => obs.disconnect();
  }, []);

  const currentScale = viewMode === 'fit' ? fitScale : 1.0;

  const updateField = <K extends keyof ThemeConfig>(field: K, value: ThemeConfig[K]) => {
    updateTheme({ ...currentTheme, [field]: value });
  };
  
  const resetLogoPosition = () => {
      updateTheme({ ...currentTheme, logoPosX: 0, logoPosY: 0, logoSize: 100, logoOpacity: 100 });
  };

  const handleApplyPreset = (id: TemplateId) => {
    updateTheme(THEME_PRESETS[id]);
    updateSettings('defaultTemplateId', id);
  };

  const getBlendLabel = (mode: string) => {
      if (mode === 'multiply') return t.blendMultiply || 'Multiply (Remove White)';
      if (mode === 'screen') return t.blendScreen || 'Screen (Remove Black)';
      return t.blendNormal || 'Normal';
  };

  // --- Interaction Logic (Move & Resize) ---
  const handleLogoMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Safety check: ensure coordinates exist, default to 0 if undefined (legacy data)
    const startPosX = typeof currentTheme.logoPosX === 'number' ? currentTheme.logoPosX : 0;
    const startPosY = typeof currentTheme.logoPosY === 'number' ? currentTheme.logoPosY : 0;

    setInteraction({
        type: 'move',
        startX: e.clientX,
        startY: e.clientY,
        initialVal1: startPosX,
        initialVal2: startPosY
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startSize = typeof currentTheme.logoSize === 'number' ? currentTheme.logoSize : 100;

    setInteraction({
        type: 'resize',
        startX: e.clientX,
        startY: e.clientY,
        initialVal1: startSize
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!interaction) return;
        
        // Calculate raw delta
        const deltaX = (e.clientX - interaction.startX);
        const deltaY = (e.clientY - interaction.startY);
        
        // Adjust delta by the current zoom scale so movement is 1:1 with cursor
        const scaledDeltaX = deltaX / currentScale;
        const scaledDeltaY = deltaY / currentScale;

        if (interaction.type === 'move') {
            const newX = Math.round(interaction.initialVal1 + scaledDeltaX);
            const newY = Math.round((interaction.initialVal2 || 0) + scaledDeltaY);
            
            // Batch update to avoid partial renders or lag
            updateTheme({ 
                ...currentTheme, 
                logoPosX: newX, 
                logoPosY: newY 
            });
        } 
        else if (interaction.type === 'resize') {
            // Dragging diagonally bottom-right adds size
            // Sensitivity factor 0.5 for smoother control
            const change = (scaledDeltaX + scaledDeltaY) / 2;
            const newSize = Math.max(20, Math.min(300, Math.round(interaction.initialVal1 + change)));
            updateField('logoSize', newSize);
        }
    };
    
    const handleMouseUp = () => setInteraction(null);

    if (interaction) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        // Add grabbing cursor to body while dragging
        document.body.style.cursor = interaction.type === 'move' ? 'grabbing' : 'nwse-resize';
    } else {
        document.body.style.cursor = '';
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
    }
  }, [interaction, currentScale, currentTheme]); 


  const fonts: { id: FontFamily, name: string }[] = [
    { id: 'sans', name: 'Inter (Modern Sans)' },
    { id: 'serif', name: 'Serif Standard' },
    { id: 'mono', name: 'Fira Code (Technical)' },
    { id: 'playfair', name: 'Playfair Display (Elegant)' },
    { id: 'montserrat', name: 'Montserrat (Geometric)' },
    { id: 'noto', name: 'Noto Sans KR (Universal)' },
    { id: 'roboto-slab', name: 'Roboto Slab (Organic)' }
  ];

  const headers = [
    { id: 'split', name: t.headerSplit, icon: <AlignJustify size={14}/> },
    { id: 'centered', name: t.headerCentered, icon: <AlignCenter size={14}/> },
    { id: 'banner', name: t.headerBanner, icon: <Layout size={14}/> },
    { id: 'clean', name: t.headerClean, icon: <Minus size={14}/> }
  ];

  const colors = [
    '#0f172a', '#4f46e5', '#0ea5e9', '#065f46', '#166534', '#991b1b', '#d97706', '#701a75', '#ec4899', '#000000'
  ];

  const radii = [
    { id: 'none', name: '0px' },
    { id: 'small', name: '4px' },
    { id: 'medium', name: '8px' },
    { id: 'large', name: '16px' },
    { id: 'full', name: '99px' }
  ];

  // Paper Dimensions
  const PAPER_WIDTH = 794;
  const PAPER_HEIGHT = 1123;

  return (
    // Removed animations to ensure stable layout calculation on mount
    <div className="flex flex-col lg:flex-row gap-0 h-full w-full">
      {/* LEFT PANEL: Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-6 bg-white p-8 border-r border-slate-200 overflow-y-auto h-full custom-scrollbar relative z-20 shadow-2xl shrink-0">
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Layers size={14} className="text-indigo-600" />
            {t.themePresets}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleApplyPreset(tpl.id)}
                className={`p-4 rounded-2xl text-left border-2 transition-all group ${
                  settings.defaultTemplateId === tpl.id 
                    ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                    : 'border-slate-50 hover:border-indigo-200 bg-slate-50/50'
                }`}
              >
                <div className={`font-black text-[11px] uppercase truncate ${settings.defaultTemplateId === tpl.id ? 'text-indigo-700' : 'text-slate-500'}`}>{tpl.name}</div>
                <div className="flex gap-1.5 mt-3">
                  <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: THEME_PRESETS[tpl.id].primaryColor }}></div>
                  <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: THEME_PRESETS[tpl.id].paperColor }}></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-slate-100"></div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} />
              {t.typography}
            </h3>
            <div className="relative">
              <select 
                value={currentTheme.fontFamily}
                onChange={(e) => updateField('fontFamily', e.target.value as any)}
                className="w-full px-5 py-4 rounded-2xl text-sm font-black border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                aria-label={t.typography || "Typography"}
              >
                {fonts.map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <RefreshCcw size={16} />
              </div>
            </div>
          </div>

          <div 
             className="space-y-4"
             data-tutorial-id="tutorial-target-theme-color" // Target for Step 8
          >
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} />
              {t.primaryColor}
            </h3>
            <div className="flex flex-wrap gap-3 p-1">
              {colors.map((color, idx) => {
                return (
                  <button
                    key={color}
                    onClick={() => updateField('primaryColor', color)}
                    className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center relative ${
                      currentTheme.primaryColor === color ? 'border-slate-900 shadow-xl ring-4 ring-slate-100' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {currentTheme.primaryColor === color && <Check size={16} className="text-white" />}
                  </button>
                );
              })}
              {/* Custom Color Picker */}
              <div className="relative group">
                  <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center bg-white cursor-pointer overflow-hidden ${
                      !colors.includes(currentTheme.primaryColor) ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                     <Pipette size={16} className="text-slate-400" />
                     <input 
                        type="color" 
                        value={currentTheme.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title={t.customColor}
                        aria-label={t.customColor || "Custom Color"}
                     />
                  </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={14} />
              {t.layoutStructure}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {headers.map(h => (
                <button
                  key={h.id}
                  onClick={() => updateField('headerLayout', h.id as any)}
                  className={`p-4 rounded-2xl text-[11px] font-black border-2 uppercase transition-all flex flex-col items-center justify-center gap-2 ${
                    currentTheme.headerLayout === h.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${currentTheme.headerLayout === h.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                    {h.icon}
                  </div>
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100"></div>

          {/* Logo & Branding Studio */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Image size={14} />
                   {t.logoBranding}
                 </h3>
                 <button onClick={resetLogoPosition} className="text-slate-400 hover:text-indigo-600 transition-colors" title={t.resetPosition}>
                    <RotateCcw size={14}/>
                 </button>
             </div>
             
             {/* Logo Options Grid */}
             <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 {/* Size Slider */}
                 <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>{t.logoSize}</span>
                        <span>{currentTheme.logoSize}%</span>
                    </div>
                    <input 
                        type="range" min="20" max="300" 
                        value={currentTheme.logoSize} 
                        onChange={(e) => updateField('logoSize', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        aria-label={t.logoSize || "Logo Size"}
                    />
                 </div>

                 {/* Opacity Slider */}
                 <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Droplets size={10}/> {t.logoOpacity}</span>
                        <span>{currentTheme.logoOpacity ?? 100}%</span>
                    </div>
                    <input 
                        type="range" min="10" max="100" 
                        value={currentTheme.logoOpacity ?? 100} 
                        onChange={(e) => updateField('logoOpacity', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        aria-label={t.logoOpacity || "Logo Opacity"}
                    />
                 </div>
                 
                 {/* Alignment */}
                 <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                     {['left', 'center', 'right'].map((align) => (
                         <button
                            key={align}
                            onClick={() => updateField('logoAlignment', align as any)}
                            className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-all ${currentTheme.logoAlignment === align ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                             {align === 'left' ? <AlignLeft size={16}/> : align === 'center' ? <AlignCenter size={16}/> : <AlignRight size={16}/>}
                         </button>
                     ))}
                 </div>
                 
                 {/* Toggles: Invert & Blend Mode Dropdown */}
                 <div className="flex gap-2">
                    {/* Invert Button */}
                    <button 
                        onClick={() => updateField('invertLogo', !currentTheme.invertLogo)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1 ${currentTheme.invertLogo ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Contrast size={14}/> <span>{t.invertLogo}</span>
                        </div>
                    </button>

                    {/* Blend Mode Dropdown */}
                    <div className="relative flex-1">
                         <button 
                            onClick={() => setIsBlendDropdownOpen(!isBlendDropdownOpen)}
                            className={`w-full h-full py-3 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1 bg-white text-slate-600 border-slate-200 hover:border-indigo-300 ${isBlendDropdownOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                         >
                             <span className="capitalize truncate px-1">{getBlendLabel(currentTheme.logoBlendMode || 'normal')}</span>
                         </button>
                         
                         {isBlendDropdownOpen && (
                             <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsBlendDropdownOpen(false)}></div>
                                <div className="absolute bottom-full right-0 mb-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[180px]">
                                     {['normal', 'multiply', 'screen'].map((mode) => (
                                         <button
                                            key={mode}
                                            onClick={() => {
                                                updateField('logoBlendMode', mode as any);
                                                setIsBlendDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center justify-between ${currentTheme.logoBlendMode === mode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
                                         >
                                            {getBlendLabel(mode)}
                                            {currentTheme.logoBlendMode === mode && <Check size={12}/>}
                                         </button>
                                     ))}
                                </div>
                             </>
                         )}
                    </div>
                 </div>
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Scissors size={14} />
               {t.borderRadius}
             </h3>
             <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
               {radii.map(r => (
                 <button
                   key={r.id}
                   onClick={() => updateField('borderRadius', r.id as any)}
                   className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${
                     currentTheme.borderRadius === r.id ? 'bg-white shadow-md text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {r.name}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <Stamp size={22} className="text-indigo-500" />
              <div>
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t.showWatermark}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t.patternBackground}</div>
              </div>
            </div>
            <button 
              onClick={() => updateField('showWatermark', !currentTheme.showWatermark)}
              className={`w-14 h-7 rounded-full relative transition-all duration-300 ${currentTheme.showWatermark ? 'bg-indigo-600 shadow-inner' : 'bg-slate-300'}`}
              aria-label={t.showWatermark || "Toggle Pattern"}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${currentTheme.showWatermark ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8 flex flex-col gap-3">
          <button 
            onClick={() => createQuote(settings, settings.defaultTemplateId)}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3"
          >
            <FilePlus size={18} />
            {t.useThisTheme}
          </button>
          <button 
            onClick={() => {
              updateSettings('theme', currentTheme);
              alert(t.saveSuccess);
            }}
            className="w-full py-4 bg-white text-slate-500 hover:text-slate-900 border border-slate-200 font-bold rounded-2xl hover:border-slate-300 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <Check size={14} />
            {t.saveGlobalDefault}
          </button>
        </div>
      </div>

      {/* RIGHT: Live Interactive Preview */}
      <div 
        ref={containerRef}
        // Added min-h-0 to fix nested flex scrolling
        className="flex-1 bg-slate-200 h-full overflow-hidden flex flex-col relative group/preview min-h-0"
      >
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

        {/* Drag Hint Overlay */}
        <div className="absolute top-6 left-6 z-30 pointer-events-none opacity-0 group-hover/preview:opacity-100 transition-opacity">
             <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-2 border border-white/20 backdrop-blur-sm">
                 <Move size={12}/> {t.dragHint}
             </div>
        </div>
        
        {/* Preview Container */}
        <div 
            className={`w-full h-full custom-scrollbar flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 ${viewMode === '100%' ? 'overflow-auto items-start justify-center py-20' : 'overflow-hidden'}`}
        >
          {/* Wrapper to hold exact scaled dimensions so flexbox centering works properly */}
          <div 
             style={{ 
                 width: PAPER_WIDTH * currentScale, 
                 height: PAPER_HEIGHT * currentScale,
                 // Removed transitions to prevent scroll jitter and ensure snap-fit
             }}
             // Switched to shadow-2xl for better compatibility than drop-shadow which might extend bound
             className="relative shadow-2xl"
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
                    theme={currentTheme} 
                    settings={settings} 
                    lang={lang} 
                    interactive={true} 
                    onLogoMouseDown={handleLogoMouseDown} 
                    onResizeMouseDown={handleResizeMouseDown}
                 />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
