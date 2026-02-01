import React, { useMemo } from 'react';
import { UI_STRINGS } from '../constants';
import { QuoteStatus } from '../types';
import { 
  Clock, Plus, FileText, Sparkles, Copy, FilePlus2, ArrowRight, PlayCircle
} from 'lucide-react';
import { useQuotes } from '../contexts/QuoteContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTutorial } from '../contexts/TutorialContext';

export const Dashboard: React.FC = () => {
  const { quotes, createQuote, duplicateQuote, setCurrentQuote, setIsEditing, setIsEditorPreviewOpen, setActiveTab } = useQuotes();
  const { settings, lang, updateThemeField, incrementDocNumber } = useSettings();
  const { startTutorial, stopTutorial, tutorialStep, nextStep } = useTutorial();

  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'];

  // Logic to find the most recent DRAFT quote
  const latestDraft = useMemo(() => {
      const drafts = quotes.filter(q => q.status === QuoteStatus.DRAFT);
      if (drafts.length === 0) return null;
      return drafts.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0];
  }, [quotes]);

  // Recent 5 quotes
  const recentQuotes = useMemo(() => {
      return [...quotes].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).slice(0, 5);
  }, [quotes]);

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.WON: return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case QuoteStatus.FINALIZED: return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case QuoteStatus.LOST: return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-amber-100 text-amber-600 border-amber-200';
    }
  };

  const handleEditQuote = (quote: any) => {
    setCurrentQuote(quote);
    setIsEditing(true);
    setIsEditorPreviewOpen(false);
  };

  const handleCreateNew = (templateId?: any) => {
      createQuote(settings, templateId);
      incrementDocNumber();
      // Heuristic for Tutorial Step 1 -> 2
      if (tutorialStep === 1) {
          nextStep();
      }
  };

  const handleDuplicate = (quote: any) => {
      duplicateQuote(quote, settings, (n) => updateThemeField('nextDocNumber', n), t); 
      // Note: updateThemeField is technically for theme, but settings context should handle general settings updates.
      // Current implementation of duplicateQuote in QuoteContext might need 'updateSettingsNextNum' callback.
      // SettingsContext has 'incrementDocNumber'. 
      // We should probably rely on incrementDocNumber which updates state correctly. 
      // But duplicateQuote logic in QuoteContext forces a number on the new quote based on 'settings.nextDocNumber'.
      // Then it calls the callback. 
      incrementDocNumber();
  };

  const currencySymbol = settings.defaultCurrency === 'KRW' ? '₩' : '$';

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* 1. Header & Launchpad */}
      <div className="space-y-6">
         <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.dashboard}</h2>
            <p className="text-slate-500 font-medium text-sm">{t.workspaceSub}</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Primary Action Card */}
             {latestDraft ? (
                 <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between h-64 lg:h-auto">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
                     <div className="relative z-10">
                         <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-widest mb-3">
                             <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                             {t.resumeDraft}
                         </div>
                         <h3 className="text-2xl font-bold mb-1 truncate">{latestDraft.clientName || t.clientPlaceholder}</h3>
                         <p className="text-slate-400 text-sm">{t.lastEdited}: {latestDraft.issueDate}</p>
                     </div>
                     <button 
                        onClick={() => handleEditQuote(latestDraft)}
                        className="mt-6 w-full py-4 bg-white text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                     >
                        <PlayCircle size={18} className="text-indigo-600"/> {t.continue}
                     </button>
                 </div>
             ) : (
                 <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between h-64 lg:h-auto">
                     <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                         <Sparkles size={200} />
                     </div>
                     <div className="relative z-10">
                         <div className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">{t.welcomeBack}</div>
                         <h3 className="text-3xl font-black mb-2">{t.startNewProject}</h3>
                         <p className="text-indigo-100 text-sm max-w-xs">{t.startNewProjectDesc}</p>
                     </div>
                     <button 
                        onClick={() => handleCreateNew(undefined)}
                        data-tutorial-id="guide-target-new-btn"
                        className="mt-6 w-fit px-8 py-4 bg-white text-indigo-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 hover:shadow-lg transition-all flex items-center gap-2"
                     >
                        <Plus size={18}/> {t.newQuote}
                     </button>
                 </div>
             )}

             {/* Quick Actions Grid */}
             <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => handleCreateNew('standard')} 
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left flex flex-col justify-between group h-40"
                 >
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-purple-700">{t.qa_new}</div>
                        <div className="text-xs text-slate-400 mt-1">{t.standardTemplate}</div>
                    </div>
                 </button>
                 
                 <button 
                    onClick={() => {
                        const lastQuote = quotes[0];
                        if (lastQuote) handleDuplicate(lastQuote);
                        else handleCreateNew(undefined);
                    }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all text-left flex flex-col justify-between group h-40"
                 >
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Copy size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{t.qa_copy}</div>
                        <div className="text-xs text-slate-400 mt-1">{t.qa_copy_desc}</div>
                    </div>
                 </button>
             </div>
         </div>
      </div>

      {/* 2. Recent Activity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
             <Clock size={20} className="text-slate-400" aria-hidden="true"/> {t.recentQuotes}
           </h3>
           <button 
             onClick={() => setActiveTab('quotes')} 
             className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
             aria-label={t.filterAll}
           >
             {t.filterAll} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" aria-hidden="true"/>
           </button>
        </div>

        {recentQuotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {recentQuotes.map(quote => (
                <div 
                   key={quote.id} 
                   onClick={() => handleEditQuote(quote)}
                   className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                >
                   <div className="flex justify-between items-start mb-4">
                       <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(quote.status)}`}>
                          {t[`status_${quote.status}` as keyof typeof t] || quote.status}
                       </div>
                       <div className="text-xs font-bold text-slate-400 font-mono">{quote.number}</div>
                   </div>
                   
                   <h4 className="font-bold text-slate-800 text-lg mb-1 truncate group-hover:text-indigo-700 transition-colors">{quote.clientName || t.clientPlaceholder}</h4>
                   <div className="text-xs text-slate-400 mb-6">{quote.issueDate}</div>
                   
                   <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                       <div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t.totalAmount}</div>
                           <div className="font-black text-slate-800 text-lg">{currencySymbol}{quote.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()}</div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           <ArrowRight size={14} />
                       </div>
                   </div>
                </div>
             ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-slate-300" />
             </div>
             <p className="text-base font-bold text-slate-600 mb-1">{t.noData}</p>
             <p className="text-sm text-slate-400 mb-6">{t.tutorialWelcomeDesc}</p>

          </div>
        )}
      </div>
    </div>
  );
};
