
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Quote, LineItem, Language, QuoteStatus, AppSettings, TutorialLevel } from '../types';
import { UI_STRINGS, AVAILABLE_TEMPLATES, TERMS_PRESETS } from '../constants';
import { Plus, Trash2, Save, X, Eye, Download, Loader2, Palette, ArrowLeft, Percent, Mail, BookOpen, MousePointer2, StickyNote, Copy, Check, FileCheck, FileText, ArrowUp, ArrowDown, Table } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QuotePreview } from './QuotePreview';
// import { geminiService } from '../services/geminiService'; // Removed AI Service

import { useSettings } from '../contexts/SettingsContext';
import { useQuotes } from '../contexts/QuoteContext';
import { useTutorial } from '../contexts/TutorialContext';
import ReactGA from 'react-ga4'; // Import GA4

import { useDebounce } from '../hooks/useDebounce';

// ... imports

// Define props interface
interface QuoteEditorProps { }

export const QuoteEditor: React.FC<QuoteEditorProps> = () => {
   const { settings, lang } = useSettings();
   const t = UI_STRINGS[lang] || UI_STRINGS['en'];
   const {
      currentQuote,
      setCurrentQuote,
      saveQuote,
      setIsEditing,
      isEditorPreviewOpen: showPreview,
      setIsEditorPreviewOpen: onPreviewChange,
      quotes
   } = useQuotes();

   // Guard against undefined quote when mapped to editor
   const { tutorialStep, setStep: onStepChange } = useTutorial();

   // Local state
   // Local state
   // const [magicPrompt, setMagicPrompt] = useState(''); // Removed AI State
   // const [isAiProcessing, setIsAiProcessing] = useState(false); // Removed AI State
   const [showBulkImport, setShowBulkImport] = useState(false);
   const [bulkImportText, setBulkImportText] = useState(''); // Text area for bulk import
   const [isPdfLoading, setIsPdfLoading] = useState(false);
   const [copiedText, setCopiedText] = useState(false);

   // Derived state
   const savedClients = useMemo(() => {
      if (!quotes) return [];
      const clients = new Set(quotes.map(q => q.clientName).filter(Boolean));
      return Array.from(clients).sort();
   }, [quotes]);

   // Refs
   const clientInputRef = useRef<HTMLInputElement>(null);
   // const aiInputRef = useRef<HTMLInputElement>(null); // Removed AI Ref
   const itemInputRef = useRef<HTMLInputElement>(null);

   if (!currentQuote) return null;

   const quote = currentQuote;
   const setQuote = setCurrentQuote;
   // ... existing code ...

   // Debounce the quote state to prevent excessive context updates (500ms delay)
   const debouncedQuote = useDebounce(quote, 500);

   // Sync debounced quote state with Context currentQuote
   useEffect(() => {
      setCurrentQuote(debouncedQuote);
   }, [debouncedQuote, setCurrentQuote]);


   // Aggressive Auto-Focus Logic for Tutorial (Updated Steps)
   useEffect(() => {
      const performFocus = () => {
         // Step 3: Client Input
         if (tutorialStep === 3 && clientInputRef.current) {
            clientInputRef.current.focus();
         }
         // Step 4: AI Input (New) - REMOVED
         // if (tutorialStep === 4 && aiInputRef.current) {
         //    aiInputRef.current.focus();
         // }
         // Step 5: Item Input (Shifted)
         if (tutorialStep === 5 && itemInputRef.current) {
            itemInputRef.current.focus();
         }
      };

      const t0 = setTimeout(performFocus, 50);
      const t1 = setTimeout(performFocus, 300);

      return () => { clearTimeout(t0); clearTimeout(t1); };
   }, [tutorialStep]);

   const currentTheme = quote.theme || settings.theme;

   // --- Handlers ---
   const handleAddItem = () => {
      setQuote(prev => ({
         ...prev,
         items: [...prev.items, {
            id: Math.random().toString(36).substr(2, 9),
            description: '', quantity: 1, unitPrice: 0, taxRate: settings.defaultTaxRate, discount: 0, discountType: 'amount'
         }]
      }));
   };

   const handleRemoveItem = (id: string) => {
      setQuote(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
   };

   const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
      setQuote(prev => ({
         ...prev,
         items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
      }));
   };

   const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === quote.items.length - 1)) return;

      const newItems = [...quote.items];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

      setQuote(prev => ({ ...prev, items: newItems }));
   };

   const handleDuplicateItem = (item: LineItem) => {
      const newItem = {
         ...item,
         id: Math.random().toString(36).substr(2, 9),
         description: `${item.description} (Copy)`
      };
      setQuote(prev => ({
         ...prev,
         items: [...prev.items, newItem]
      }));
   };

   const handleBulkImport = () => {
      if (!bulkImportText.trim()) return;

      const rows = bulkImportText.trim().split('\n');
      const newItems: LineItem[] = rows.map(row => {
         // Try to split by tab (Excel/Sheets) or comma
         let parts = row.includes('\t') ? row.split('\t') : row.split(',');

         const desc = parts[0]?.trim() || '';
         const qty = parts.length > 2 ? parseFloat(parts[1]?.replace(/[^0-9.]/g, '') || '1') : 1;
         const price = parts.length > 1 ? parseFloat((parts.length > 2 ? parts[2] : parts[1])?.replace(/[^0-9.]/g, '') || '0') : 0;

         return {
            id: Math.random().toString(36).substr(2, 9),
            description: desc,
            quantity: isNaN(qty) ? 1 : qty,
            unitPrice: isNaN(price) ? 0 : price,
            taxRate: settings.defaultTaxRate,
            discount: 0,
            discountType: 'amount'
         };
      });

      setQuote(prev => ({
         ...prev,
         items: [...prev.items, ...newItems]
      }));

      setBulkImportText('');
      setShowBulkImport(false);
   };

   // AI Handler Removed
   // const handleMagicDraft = async () => { ... }

   const handleApplyTermsPreset = (presetText: string) => {
      if (!presetText) return;
      setQuote(prev => ({ ...prev, terms: presetText }));
   };

   const calculateItemDiscountAmount = (item: LineItem) =>
      item.discountType === 'percentage' ? (item.quantity * item.unitPrice) * (item.discount / 100) : item.discount;

   const subtotal = quote.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
   const totalDiscount = quote.items.reduce((acc, i) => acc + calculateItemDiscountAmount(i), 0);
   const totalTax = quote.items.reduce((acc, i) => {
      const netPrice = (i.quantity * i.unitPrice) - calculateItemDiscountAmount(i);
      return acc + (netPrice * (i.taxRate / 100));
   }, 0);
   const grandTotal = subtotal - totalDiscount + totalTax;

   const handleDownloadPdf = async () => {
      const originalElement = document.getElementById('quote-paper-target');
      if (!originalElement) return;

      setIsPdfLoading(true);
      try {
         const clone = originalElement.cloneNode(true) as HTMLElement;
         const container = document.createElement('div');
         container.style.position = 'absolute';
         container.style.top = '-9999px';
         container.style.left = '-9999px';
         clone.style.transform = 'none';
         clone.classList.remove('transform', 'scale-75', 'md:scale-90', 'lg:scale-100', 'origin-top', 'transition-transform');

         container.appendChild(clone);
         document.body.appendChild(container);

         const canvas = await html2canvas(clone, {
            scale: 3,
            useCORS: true,
            backgroundColor: currentTheme.paperColor,
            logging: false
         });
         document.body.removeChild(container);

         const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

         // Basic validation of the data URL
         if (!dataUrl || dataUrl.length < 100) {
            throw new Error('Generated image data is invalid or too small');
         }

         const pdfWidth = 210; // A4 width in mm
         const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

         const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

         pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
         pdf.save(`${quote.number}.pdf`);

         // Track PDF Download
         ReactGA.event({
            category: "Quote",
            action: "Download PDF",
            label: quote.docType || "quote"
         });

      } catch (e) {
         console.error("PDF Export failed:", e);
         alert(t.pdfError);
      } finally {
         setIsPdfLoading(false);
      }
   };

   const handleSendEmail = () => {
      const title = quote.docType === 'invoice' ? t.invoiceTitle : t.quotationTitle;
      const subject = `[${title}] ${quote.number} - ${settings.companyName}`;
      const body = `Dear ${quote.clientName},

Please check the attached ${title.toLowerCase()} (${quote.number}) details below.

- Document No: ${quote.number}
- Issue Date: ${quote.issueDate}
- Total Amount: ${quote.currency} ${grandTotal.toLocaleString()}

If you have any questions, please reply to this email.

Best regards,
${settings.representativeName}
${settings.companyName}`;

      window.location.href = `mailto:${quote.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Track Email Click
      ReactGA.event({
         category: "Quote",
         action: "Click Email",
         label: quote.clientName
      });
   };

   const handleCopyToClipboard = () => {
      const symbol = quote.currency === 'KRW' ? '₩' : '$';
      const itemsSummary = quote.items.map(i =>
         `- ${i.description} (${i.quantity} x ${symbol}${i.unitPrice.toLocaleString()})`
      ).join('\n');

      const title = quote.docType === 'invoice' ? t.invoiceTitle : t.quotationTitle;

      const text = `[${title}] ${quote.number}
${t.client}: ${quote.clientName}
${t.date}: ${quote.issueDate}

${itemsSummary}

${t.grandTotal}: ${symbol}${grandTotal.toLocaleString()}

${settings.companyName}
${settings.representativeName}`;

      navigator.clipboard.writeText(text).then(() => {
         setCopiedText(true);
         setTimeout(() => setCopiedText(false), 2000);
      });
   };

   if (showPreview) {
      return (
         <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col animate-in fade-in duration-300">
            <header className="h-16 bg-slate-950 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 shrink-0">
               <button onClick={() => onPreviewChange(false)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <ArrowLeft size={16} /> {t.back}
               </button>
               <div className="flex gap-3">
                  <button
                     onClick={handleCopyToClipboard}
                     className="px-4 md:px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                     title={t.copyTextDesc}
                  >
                     {copiedText ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                     <span className="hidden sm:inline">{copiedText ? t.copySuccess : t.copyText}</span>
                  </button>
                  <button onClick={handleSendEmail} className="px-4 md:px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all hidden sm:flex">
                     <Mail size={16} /> {t.sendEmail}
                  </button>
                  <button onClick={handleDownloadPdf} disabled={isPdfLoading} className="px-4 md:px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                     {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
                  </button>
                  <button
                     data-tutorial-id={tutorialStep === 7 ? "tutorial-target-final-save" : undefined} // Updated Step 7
                     onClick={() => saveQuote({ ...quote, status: QuoteStatus.FINALIZED })}
                     className={`px-4 md:px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${tutorialStep === 7 ? 'ring-4 ring-indigo-500/50 animate-pulse' : ''}`}
                  >
                     <Save size={16} /> {t.saveAll}
                  </button>
               </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-800/50 backdrop-blur-sm custom-scrollbar">
               <div id="quote-paper-target" className="origin-top transform scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transition-transform shadow-2xl">
                  <QuotePreview theme={currentTheme} settings={settings} lang={lang} quote={quote} />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
         <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 md:px-8 bg-white z-10 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
               <h2 className="text-xl font-black text-slate-800 tracking-tight truncate">{quote.number}</h2>

               {/* Template Badge (Hidden on Mobile) */}
               <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 hidden md:flex">
                  <Palette size={12} /> {AVAILABLE_TEMPLATES.find(t => t.id === quote.templateId)?.name}
               </div>

               {/* Doc Type Toggle (Mobile & Desktop) */}
               <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                     onClick={() => setQuote({ ...quote, docType: 'quote' })}
                     className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1 ${!quote.docType || quote.docType === 'quote' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                     <FileText size={12} /> <span className="hidden sm:inline">{t.docTypeQuote}</span>
                  </button>
                  <button
                     onClick={() => setQuote({ ...quote, docType: 'invoice' })}
                     className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1 ${quote.docType === 'invoice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                  >
                     <FileCheck size={12} /> <span className="hidden sm:inline">{t.docTypeInvoice}</span>
                  </button>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button
                  data-tutorial-id={tutorialStep === 6 ? "tutorial-target-preview-btn" : undefined} // Updated Step 6
                  onClick={() => {
                     onPreviewChange(true);
                     ReactGA.event({ category: "Quote", action: "Preview", label: "Editor Button" });
                  }}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${tutorialStep === 6 ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
               >
                  <Eye size={16} /> {t.preview}
               </button>
               <button onClick={() => setIsEditing(false)} className="p-2 text-slate-300 hover:text-red-500" aria-label="Close Editor"><X size={20} /></button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8 bg-slate-50/30">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.client}</label>
                  <div className="relative">
                     <input
                        ref={clientInputRef}
                        data-tutorial-id={tutorialStep === 3 ? "tutorial-target-client-input" : undefined} // Updated Step 3
                        autoFocus={tutorialStep === 3}
                        type="text"
                        value={quote.clientName}
                        onChange={(e) => setQuote({ ...quote, clientName: e.target.value })}
                        onKeyDown={(e) => {
                           if (e.nativeEvent.isComposing) return;
                           // Logic update: Step 3 -> 4
                           if (e.key === 'Enter' && tutorialStep === 3) {
                              e.preventDefault();
                              onStepChange(5);
                              itemInputRef.current?.focus();
                           }
                        }}
                        placeholder={t.clientPlaceholder}
                        list="client-list" // Connect to datalist
                        className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${tutorialStep === 3 ? 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg' : 'border-slate-100'}`}
                        aria-label={t.client || "Client Name"}
                     />

                     {/* Client Autocomplete List */}
                     <datalist id="client-list">
                        {savedClients.map((client, i) => (
                           <option key={i} value={client} />
                        ))}
                     </datalist>

                     {tutorialStep === 3 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none animate-pulse">
                           <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hidden md:block">{t.pressEnter}</span>
                           <MousePointer2 className="text-indigo-600 fill-indigo-600" size={18} />
                        </div>
                     )}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.date}</label>
                  <input type="date" value={quote.issueDate} onChange={(e) => setQuote({ ...quote, issueDate: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" aria-label={t.date} />
               </div>
               <div className="space-y-2">
                  {/* Label changes based on docType */}
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                     {quote.docType === 'invoice' ? t.dueDate : t.expiryDate}
                  </label>
                  <input
                     type="date"
                     value={quote.expiryDate}
                     onChange={(e) => setQuote({ ...quote, expiryDate: e.target.value })}
                     className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                     aria-label={quote.docType === 'invoice' ? t.dueDate : t.expiryDate}
                  />
               </div>

               <div className="space-y-2 md:col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.currency}</label>
                  <select value={quote.currency} onChange={(e) => setQuote({ ...quote, currency: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" aria-label={t.currency}>
                     <option value="USD">USD ($)</option>
                     <option value="KRW">KRW (₩)</option>
                  </select>
               </div>
            </div>

            {/* AI Input Section Removed */}

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><Table size={16} className="text-indigo-500" /> {t.lineItems}</h3>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setShowBulkImport(!showBulkImport)}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                     >
                        <Table size={12} /> {t.bulkImport}
                     </button>
                     <button onClick={handleAddItem} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={12} /> {t.addItem}
                     </button>
                  </div>
               </div>

               {/* Bulk Import Panel */}
               {showBulkImport && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500">{t.bulkImportDesc}</span>
                        <button onClick={() => setShowBulkImport(false)} aria-label={t.close || "Close"}><X size={14} className="text-slate-400" /></button>
                     </div>
                     <textarea
                        value={bulkImportText}
                        onChange={(e) => setBulkImportText(e.target.value)}
                        className="w-full h-24 p-3 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 mb-2 font-mono"
                        placeholder={t.pasteAreaPlaceholder}
                     />
                     <div className="flex justify-end">
                        <button
                           onClick={handleBulkImport}
                           className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase"
                        >
                           {t.import}
                        </button>
                     </div>
                  </div>
               )}

               <div className="space-y-3">
                  {quote.items.length === 0 && (
                     <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                        <Plus size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">{t.startByAddingItems || "Start by adding items"}</p>
                     </div>
                  )}

                  {/* TABLE HEADER (Desktop) */}
                  {quote.items.length > 0 && (
                     <div className="hidden md:flex items-center gap-3 px-4 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                        <div className="w-6 text-center">#</div>
                        <div className="flex-1">{t.description}</div>
                        <div className="w-20 text-center">{t.quantity}</div>
                        <div className="w-32 text-right">{t.unitPrice}</div>
                        <div className="w-32 text-right">{t.discount}</div>
                        <div className="w-24 text-center">{t.tax}</div>
                        <div className="w-14"></div>
                     </div>
                  )}

                  {quote.items.map((item, idx) => (
                     <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center group hover:border-indigo-400 transition-all relative">

                        {/* Desktop Move Controls */}
                        <div className="hidden md:flex flex-col w-6 items-center justify-center text-slate-300 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                              onClick={() => handleMoveItem(idx, 'up')}
                              disabled={idx === 0}
                              className="hover:text-indigo-600 disabled:opacity-0 transition-colors"
                              aria-label="Move Item Up"
                           >
                              <ArrowUp size={12} />
                           </button>
                           <button
                              onClick={() => handleMoveItem(idx, 'down')}
                              disabled={idx === quote.items.length - 1}
                              className="hover:text-indigo-600 disabled:opacity-0 transition-colors"
                              aria-label="Move Item Down"
                           >
                              <ArrowDown size={12} />
                           </button>
                        </div>

                        {/* Description */}
                        <div className="w-full md:flex-1 space-y-1">
                           <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">{t.description}</label>
                           <div className="relative">
                              <input
                                 ref={idx === 0 ? itemInputRef : undefined}
                                 data-tutorial-id={tutorialStep === 5 && idx === 0 ? "tutorial-target-first-item-desc" : undefined} // Updated Step 5
                                 type="text"
                                 value={item.description}
                                 onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                 onKeyDown={(e) => {
                                    if (e.nativeEvent.isComposing) return;
                                    // Logic update: Step 5 -> 6
                                    if (e.key === 'Enter' && tutorialStep === 5 && idx === 0 && onStepChange) {
                                       e.preventDefault();
                                       onStepChange(6);
                                    }
                                 }}
                                 onFocus={() => {
                                    if (tutorialStep === 4 && onStepChange) {
                                       onStepChange(5);
                                    }
                                 }}
                                 className={`w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 ${tutorialStep === 5 && idx === 0 ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/20 shadow-lg' : ''}`}
                                 placeholder={t.descPlaceholder}
                                 aria-label={t.description}
                              />
                              {/* Visual Hint for Step 5 */}
                              {tutorialStep === 5 && idx === 0 && (
                                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none animate-pulse">
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hidden md:block">{t.pressEnter}</span>
                                    <MousePointer2 className="text-indigo-600 fill-indigo-600" size={18} />
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Inputs Grid/Flex */}
                        <div className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-3">

                           {/* Quantity */}
                           <div className="w-full md:w-20 space-y-1">
                              <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">{t.quantity}</label>
                              <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-sm text-center font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" aria-label={t.quantity} />
                           </div>

                           {/* Price */}
                           <div className="w-full md:w-32 space-y-1">
                              <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">{t.unitPrice}</label>
                              <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-sm text-right font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" aria-label={t.unitPrice} />
                           </div>

                           {/* Discount */}
                           <div className="w-full md:w-32 space-y-1">
                              <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">{t.discount}</label>
                              <div className="flex items-center bg-slate-50 border border-transparent rounded-lg focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all w-full">
                                 <input
                                    type="number"
                                    value={item.discount}
                                    onChange={(e) => handleItemChange(item.id, 'discount', parseFloat(e.target.value))}
                                    className="w-full p-2.5 bg-transparent outline-none text-sm text-right font-bold min-w-0"
                                    aria-label={t.discount}
                                 />
                                 <div className="h-5 w-px bg-slate-300 mx-1"></div>
                                 <select
                                    value={item.discountType}
                                    onChange={(e) => handleItemChange(item.id, 'discountType', e.target.value)}
                                    className="bg-transparent text-[10px] font-black uppercase text-slate-500 pr-2 pl-1 py-2 outline-none cursor-pointer hover:text-indigo-600 appearance-none"
                                    aria-label="Discount Type"
                                 >
                                    <option value="amount">{quote.currency === 'KRW' ? '₩' : '$'}</option>
                                    <option value="percentage">%</option>
                                 </select>
                              </div>
                           </div>

                           {/* Tax */}
                           <div className="w-full md:w-24 space-y-1">
                              <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">{t.tax}</label>
                              <div className="relative">
                                 <input
                                    type="number"
                                    value={item.taxRate}
                                    onChange={(e) => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value))}
                                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-sm text-center font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pr-6"
                                    aria-label={t.tax || "Tax Rate"}
                                 />
                                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Percent size={12} />
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex w-14 justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                              onClick={() => handleDuplicateItem(item)}
                              className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title={t.cloneItem}
                              aria-label={t.cloneItem}
                           >
                              <Copy size={16} />
                           </button>
                           <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" aria-label={t.delete}>
                              <Trash2 size={16} />
                           </button>
                        </div>

                        {/* Mobile Remove Button */}
                        <div className="w-full grid grid-cols-3 gap-2 md:hidden pt-2 border-t border-slate-50 mt-1">
                           <button onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0} className="py-2 bg-slate-50 text-slate-500 rounded-lg disabled:opacity-50 flex justify-center" aria-label="Move Up"><ArrowUp size={16} /></button>
                           <button onClick={() => handleMoveItem(idx, 'down')} disabled={idx === quote.items.length - 1} className="py-2 bg-slate-50 text-slate-500 rounded-lg disabled:opacity-50 flex justify-center" aria-label="Move Down"><ArrowDown size={16} /></button>
                           <button onClick={() => handleRemoveItem(item.id)} className="py-2 bg-red-50 text-red-500 rounded-lg font-bold flex justify-center" aria-label={t.delete}>{t.delete}</button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
               <div className="space-y-6">
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{t.terms}</h3>
                        <div className="relative group">
                           <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors cursor-pointer">
                              <BookOpen size={12} /> {t.loadPreset}
                              <select
                                 onChange={(e) => handleApplyTermsPreset(e.target.value)}
                                 className="absolute inset-0 opacity-0 cursor-pointer"
                                 value=""
                                 aria-label={t.loadPreset || "Load Preset"}
                              >
                                 <option value="" disabled>{t.loadPreset}</option>
                                 {TERMS_PRESETS[lang].map((preset, idx) => (
                                    <option key={idx} value={preset.text}>{preset.label}</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </div>
                     <textarea
                        value={quote.terms}
                        onChange={(e) => setQuote({ ...quote, terms: e.target.value })}
                        className="w-full h-32 p-4 bg-white border border-slate-100 rounded-2xl text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={t.termsPlaceholder}
                        aria-label={t.terms || "Terms"}
                     />
                  </div>

                  {/* Added Footer Notes Input */}
                  <div className="space-y-3">
                     <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <StickyNote size={14} /> {t.footerNotes}
                     </h3>
                     <textarea
                        value={quote.notes}
                        onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                        className="w-full h-20 p-4 bg-white border border-slate-100 rounded-2xl text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={t.noteTax}
                        aria-label={t.footerNotes || "Footer Notes"}
                     />
                  </div>
               </div>

               <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                     <div className="flex justify-between text-sm font-medium text-slate-400">
                        <span>{t.subtotal}</span>
                        <span className="text-white">{quote.currency} {subtotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-sm font-medium text-slate-400">
                        <span>{t.tax} (VAT)</span>
                        <span className="text-white">{quote.currency} {totalTax.toLocaleString()}</span>
                     </div>
                     {totalDiscount > 0 && (
                        <div className="flex justify-between text-sm font-medium text-red-400">
                           <span>{t.discount}</span>
                           <span>- {quote.currency} {totalDiscount.toLocaleString()}</span>
                        </div>
                     )}
                  </div>
                  <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t.grandTotal}</span>
                     <span className="text-3xl font-black tracking-tight">{quote.currency} {grandTotal.toLocaleString()}</span>
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
};
