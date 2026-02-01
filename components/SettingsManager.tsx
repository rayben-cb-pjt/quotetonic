import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTutorial } from '../contexts/TutorialContext';
import { UI_STRINGS } from '../constants';
import { QuotePreview } from './QuotePreview';
import { 
  Banknote, ImageIcon, Upload, X, RotateCcw, 
  Stamp, Trash2, Building2, Save, Loader2, 
  Globe, Mail, Smartphone, MapPin, Sparkles,
  Monitor, CreditCard, Eraser, PenLine, MousePointerClick,
  Maximize, ZoomIn, Move
} from 'lucide-react';
import { ThemeConfig } from '../types';

// Fixed: Component defined outside to prevent re-creation and focus loss on render
const InputGroup = ({ icon: Icon, label, value, onChange, placeholder }: any) => {
  const id = React.useMemo(() => `input-${label?.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 5)}`, [label]);
  return (
    <div className="space-y-1.5">
        <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {Icon && <Icon size={10} />} {label}
        </label>
        <div className="relative group">
            <input 
                id={id}
                type="text" 
                value={value || ''} 
                onChange={onChange} 
                className="w-full p-3 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-300" 
                placeholder={placeholder}
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5 pointer-events-none group-hover:ring-black/10 transition-all"></div>
        </div>
    </div>
  );
};

export const SettingsManager: React.FC = () => {
  const { settings, updateSettings, updateTheme: onUpdateThemeField } = useSettings();
  const { tutorialStep, setStep: onStepChange } = useTutorial();
  const lang = settings.language;
  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'];

  // Alias for updateSettings to match existing logic if needed, or just use directly
  const onUpdateSettings = updateSettings;

  const [isSaving, setIsSaving] = useState(false);
  const [sigMode, setSigMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [initials, setInitials] = useState('');
  const [sigStyle, setSigStyle] = useState<'classic' | 'script' | 'stamp'>('script');
  const [inkColor, setInkColor] = useState<'#0f172a' | '#1d4ed8' | '#dc2626'>('#0f172a');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // --- Enhanced Preview Scaling Logic (Matching Design Center EXACTLY) ---
  const [viewMode, setViewMode] = useState<'fit' | '100%'>('fit');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.45);
  
  // Paper Dimensions
  const PAPER_WIDTH = 794;
  const PAPER_HEIGHT = 1123;

  // Auto-switch to DRAW mode if tutorial step 14 is active
  useEffect(() => {
     if (tutorialStep === 14) {
         setSigMode('draw');
     }
  }, [tutorialStep]);

  // Dynamic Scale Calculation matching TemplateCustomizer
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const updateScale = () => {
        const { width, height } = previewContainerRef.current!.getBoundingClientRect();
        
        // Ensure there is space for padding (horizontal 40px, vertical 60px)
        const availableW = width - 40;
        const availableH = height - 60;
        
        if (availableW <= 0 || availableH <= 0) return;

        const scaleW = availableW / PAPER_WIDTH;
        const scaleH = availableH / PAPER_HEIGHT;
        
        // Multiplier to give a bit of breathing room
        setFitScale(Math.min(scaleW, scaleH) * 0.95);
    };
    
    // Initial calc
    updateScale();
    
    // Listen for resize
    const observer = new ResizeObserver(updateScale);
    if (previewContainerRef.current) {
        observer.observe(previewContainerRef.current);
    }

    return () => observer.disconnect();
  }, [previewContainerRef.current]);

  const currentScale = viewMode === 'fit' ? fitScale : 1.0;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => { 
        setIsSaving(false); 
        alert(t.saveSuccess); 
        // Auto-advance tutorial if at save step
        if (tutorialStep === 15 && onStepChange) {
            onStepChange(16);
        }
    }, 600);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; 
      if(f) { 
          const r = new FileReader(); 
          r.onloadend = () => {
              onUpdateSettings('companyLogo', r.result as string);
              // Auto-advance tutorial from Step 12 to 13 upon upload
              if (tutorialStep === 12 && onStepChange) {
                  onStepChange(13);
              }
          }; 
          r.readAsDataURL(f); 
      }
  };

  // --- Canvas Logic (Signature) ---
  const initCanvas = () => {
    if (sigMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  useEffect(() => {
    const handle = requestAnimationFrame(initCanvas);
    window.addEventListener('resize', initCanvas);
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', initCanvas);
    };
  }, [sigMode, inkColor]); // Re-init when ink color changes

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    if ('nativeEvent' in e && (e.nativeEvent as any).offsetX !== undefined) {
      return {
        x: (e.nativeEvent as any).offsetX,
        y: (e.nativeEvent as any).offsetY
      };
    }

    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : (e as unknown as MouseEvent);
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    
    setIsDrawing(true);
    window.dispatchEvent(new CustomEvent('quotetonic-drawing-start'));

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawing) {
      setIsDrawing(false);
      window.dispatchEvent(new CustomEvent('quotetonic-drawing-end'));
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.closePath();
      
      // Auto-advance tutorial if drawing on Step 14
      if (tutorialStep === 14 && onStepChange) {
          onStepChange(15);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  };

  const applyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onUpdateSettings('companySeal', dataUrl);
    }
  };

  const generateInitialStamp = () => {
    if (!initials) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 200, 200);
      if (sigStyle === 'stamp') {
        ctx.strokeStyle = inkColor === '#0f172a' ? '#ef4444' : inkColor; // Default stamp red if black selected
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, 160, 160);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = 'bold 60px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials.substring(0, 2), 100, 100);
      } else {
        ctx.fillStyle = inkColor;
        ctx.font = sigStyle === 'script' ? 'italic bold 80px "Playfair Display"' : 'bold 70px "Montserrat"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 100, 100);
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(30, 140);
        ctx.quadraticCurveTo(100, 160, 170, 140);
        ctx.stroke();
      }
      onUpdateSettings('companySeal', tempCanvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-8rem)] w-full">
      
      {/* LEFT: Scrollable Settings Form */}
      <div className="w-full lg:w-96 flex-none overflow-y-auto custom-scrollbar p-6 space-y-8 pb-20 border-r border-slate-200 bg-white z-10">
          
          {/* 1. Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Building2 className="text-indigo-500" size={20}/> {t.companyIdentity}</h3>
            
                            <div className="space-y-4" data-tutorial-id="tutorial-target-settings-logo">
                <div className="flex items-start gap-4">
                    <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden group hover:border-indigo-300 transition-colors shrink-0 ${settings.theme.invertLogo ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        {settings.companyLogo ? (
                            <>
                                <img 
                                  src={settings.companyLogo} 
                                  className={`w-full h-full object-contain p-2 ${settings.theme.invertLogo ? 'invert' : ''}`} 
                                  alt="Logo" 
                                />
                                <button 
                                  onClick={() => onUpdateSettings('companyLogo', '')} 
                                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  aria-label={t.removeLogo || "Remove Logo"}
                                >
                                  <Trash2 size={16}/>
                                </button>
                            </>
                        ) : (
                            <Upload className="text-slate-300" size={24} aria-hidden="true" />
                        )}
                        <input 
                            type="file" 
                            onChange={handleLogoUpload} 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*" 
                            aria-label={t.uploadLogo || "Upload Logo"}
                            title={t.uploadLogo || "Upload Logo"}
                        />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                        <div>
                           <p className="text-xs font-bold text-slate-700 mb-0.5">{t.uploadLogo}</p>
                           <p className="text-[10px] text-slate-400">{t.uploadTip}</p>
                        </div>
                        
                        {/* Hint to go to Design Center */}
                        {settings.companyLogo && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex items-start gap-2">
                                <Sparkles size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-indigo-800 font-medium leading-tight">
                                    {t.logoSettingsMoved}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
                <InputGroup label={t.companyName} value={settings.companyName} onChange={(e: any) => onUpdateSettings('companyName', e.target.value)} />
                <InputGroup label={t.representative} value={settings.representativeName} onChange={(e: any) => onUpdateSettings('representativeName', e.target.value)} />
            </div>
          </div>

          {/* 2. Contact Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
             <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Smartphone className="text-emerald-500" size={20}/> {t.contactInfo}</h3>
             <div className="space-y-4">
                <InputGroup icon={MapPin} label={t.address} value={settings.companyAddress} onChange={(e: any) => onUpdateSettings('companyAddress', e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup icon={Mail} label={t.companyEmail} value={settings.companyEmail} onChange={(e: any) => onUpdateSettings('companyEmail', e.target.value)} />
                    <InputGroup icon={Smartphone} label={t.companyPhone} value={settings.companyPhone} onChange={(e: any) => onUpdateSettings('companyPhone', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <InputGroup label={t.regNo} value={settings.companyRegNo} onChange={(e: any) => onUpdateSettings('companyRegNo', e.target.value)} />
                     <InputGroup icon={Globe} label={t.website} value={settings.companyWebsite} onChange={(e: any) => onUpdateSettings('companyWebsite', e.target.value)} />
                </div>
             </div>
          </div>

          {/* 3. Financials */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
             <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Banknote className="text-amber-500" size={20}/> {t.financialDefaults}</h3>
             <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.bankInfo}</label>
                  <textarea value={settings.bankInfo} onChange={(e) => onUpdateSettings('bankInfo', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white h-24 resize-none transition-all" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <InputGroup label={t.docPrefix} value={settings.docNumberPrefix} onChange={(e: any) => onUpdateSettings('docNumberPrefix', e.target.value)} placeholder={t.docPrefixPlaceholder} />
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.nextNumber}</label>
                     <input type="number" value={settings.nextDocNumber} onChange={(e) => onUpdateSettings('nextDocNumber', parseInt(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500" aria-label={t.nextNumber || "Next Number"} />
                  </div>
               </div>
             </div>
          </div>

          {/* 4. Signature Lab */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6" data-tutorial-id="tutorial-target-settings-seal">
             <div className="flex justify-between items-center">
                 <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Stamp className="text-red-500" size={20}/> {t.signatureLab}</h3>
                 
                 {/* Ink Color Selector */}
                 {(sigMode === 'draw' || sigMode === 'type') && (
                     <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {[
                            { color: '#0f172a', label: t.colorBlack }, 
                            { color: '#1d4ed8', label: t.colorBlue }, 
                            { color: '#dc2626', label: t.colorRed }
                        ].map((ink) => (
                             <button
                                key={ink.color}
                                onClick={() => setInkColor(ink.color as any)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${inkColor === ink.color ? 'bg-white shadow-sm ring-1 ring-black/10 scale-110' : 'hover:scale-105'}`}
                                title={ink.label}
                             >
                                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ink.color }}></div>
                             </button>
                        ))}
                     </div>
                 )}
             </div>
             
             {/* Mode Selector */}
             <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                 {['draw', 'type', 'upload'].map((m) => (
                     <button
                        key={m}
                        onClick={() => setSigMode(m as any)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${sigMode === m ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                     >
                        {m === 'draw' && <PenLine size={14}/>}
                        {m === 'type' && <MousePointerClick size={14}/>}
                        {m === 'upload' && <Upload size={14}/>}
                        {t[m === 'draw' ? 'drawSignature' : m === 'type' ? 'typeSignature' : 'uploadSeal']}
                     </button>
                 ))}
             </div>

             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative min-h-[240px] flex items-center justify-center overflow-hidden">
                {/* Paper Texture Effect */}
                <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                
                {sigMode === 'draw' && (
                    <div className="w-full space-y-3 z-10" data-tutorial-id="tutorial-target-settings-canvas">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden relative cursor-crosshair">
                             <canvas 
                                ref={canvasRef} 
                                className="w-full h-[180px] block"
                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} 
                                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} 
                             />
                             <div className="absolute top-3 right-3 flex gap-2">
                                <button onClick={clearCanvas} className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors shadow-sm" title="Clear"><Eraser size={16}/></button>
                             </div>
                             <div className="absolute bottom-3 left-3 pointer-events-none opacity-30 text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">
                                {t.drawSignatureDesc}
                             </div>
                        </div>
                        <button onClick={applyCanvasSignature} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 active:scale-95 transition-all shadow-md">{t.applySignature}</button>
                    </div>
                )}
                {sigMode === 'type' && (
                    <div className="w-full space-y-4 z-10">
                       <div className="relative">
                            <input 
                                type="text" maxLength={4} 
                                value={initials} 
                                onChange={(e) => setInitials(e.target.value)} 
                                className="w-full p-4 text-center text-3xl font-black bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-200" 
                                aria-label={t.initialPlaceholder || "Initials"}
                                placeholder={t.initialPlaceholder}
                                style={{ color: inkColor }} 
                            />
                       </div>
                       <div className="flex gap-2 justify-center">
                           {['classic', 'script', 'stamp'].map((s) => (
                               <button key={s} onClick={() => setSigStyle(s as any)} className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${sigStyle === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{s}</button>
                           ))}
                       </div>
                       <button onClick={generateInitialStamp} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 active:scale-95 transition-all shadow-md">{t.generateWithAi}</button>
                    </div>
                )}
                {sigMode === 'upload' && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-white/50 w-full hover:bg-white hover:border-indigo-400 transition-all cursor-pointer relative z-10">
                        <Upload size={40} className="mx-auto text-slate-300 mb-3"/>
                        <p className="text-sm font-bold text-slate-600 mb-1">{t.selectImage}</p>
                        <p className="text-xs text-slate-400">{t.uploadTip}</p>
                        <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => onUpdateSettings('companySeal', r.result as string); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" aria-label={t.uploadSeal || "Upload Seal"} title={t.uploadSeal || "Upload Seal"} />
                    </div>
                )}
             </div>
          </div>
      </div>

      {/* RIGHT: Live Preview (Responsive & Robust) */}
      <div 
        ref={previewContainerRef}
        className="flex-1 bg-slate-200 h-full overflow-hidden flex flex-col relative group/preview min-h-0"
      >
          {/* Top Bar for View Toggle & Save */}
          <div className="absolute top-6 right-6 z-20 flex gap-4">
              {/* View Toggles */}
              <div className="flex bg-white/80 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-1">
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

              {/* Save Button */}
              <button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  data-tutorial-id="tutorial-target-settings-save"
                  className={`px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 ${tutorialStep === 15 ? 'ring-4 ring-indigo-500/50 animate-pulse' : ''}`}
              >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                  {isSaving ? t.saving : t.saveAll}
              </button>
          </div>
          
          {/* Label */}
          <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 shadow-sm pointer-events-none flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-500"/> {t.livePreview}
          </div>

          {/* Drag Hint Overlay */}
          <div className="absolute top-6 left-32 z-30 pointer-events-none opacity-0 group-hover/preview:opacity-100 transition-opacity">
             <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-2 border border-white/20 backdrop-blur-sm">
                 <Move size={12}/> {t.dragHint}
             </div>
          </div>

          {/* Preview Scroll Area */}
          <div className={`w-full h-full custom-scrollbar transition-all bg-gradient-to-br from-slate-200 to-slate-300 ${viewMode === '100%' ? 'overflow-auto grid place-items-center py-20' : 'flex items-center justify-center overflow-hidden'}`}>
             
             {/* Wrapper for exact scaling */}
             <div 
                style={{ 
                    width: PAPER_WIDTH * currentScale, 
                    height: PAPER_HEIGHT * currentScale,
                    transition: viewMode === 'fit' ? 'width 0.3s, height 0.3s' : 'none'
                }}
                className="relative shadow-2xl rounded-sm bg-white shrink-0"
             >
                 {/* Scaled Content */}
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
                          theme={settings.theme} 
                          settings={settings} 
                          lang={lang}
                          interactive={false}
                      />
                 </div>
             </div>
          </div>
      </div>

      {/* Mobile Save Button (visible only on small screens) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
        >
           {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} 
        </button>
      </div>

    </div>
  );
};
