import React, { useState, useMemo } from 'react';
import { Quote, QuoteStatus } from '../types';
import { UI_STRINGS } from '../constants';
import { Search, Plus, List, Kanban, Inbox, ChevronRight, ThumbsUp, ThumbsDown, CheckCircle2, Clock, ExternalLink, Copy, Trash2, ChevronDown, CreditCard } from 'lucide-react';
import { useQuotes } from '../contexts/QuoteContext';
import { useSettings } from '../contexts/SettingsContext';

type FilterStatus = 'all' | QuoteStatus;
type ViewMode = 'list' | 'board';

export const DocumentLibrary: React.FC = () => {
  const { quotes, createQuote, duplicateQuote, deleteQuote, updateQuoteStatus, setCurrentQuote, setIsEditing, setIsEditorPreviewOpen } = useQuotes();
  const { settings, lang, incrementDocNumber } = useSettings();

  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'] || {
      quotes: 'Documents',
      newQuote: 'New',
      workspaceSub: 'Manage documents',
      searchPlaceholder: 'Search...',
      filterAll: 'All',
      noSearchResults: 'No results',
      noData: 'No data',
      tutorialWelcomeDesc: 'Create a new doc',
      createNew: 'Create',
      duplicate: 'Duplicate',
      delete: 'Delete',
      totalAmount: 'Total',
      markAsWon: 'Mark Won',
      markAsLost: 'Mark Lost',
      status_Finalized: 'Finalized',
      status_Draft: 'Draft',
      status_Won: 'Won',
      status_Lost: 'Lost',
      viewBoard: 'Board',
      viewList: 'List',
      col_draft: 'Drafts',
      col_finalized: 'Sent',
      col_won: 'Won',
      col_lost: 'Lost',
  } as any;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const matchesSearch = 
        quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        quote.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [quotes, searchTerm, filterStatus]);

  const stats = {
    all: quotes.length,
    draft: quotes.filter(q => q.status === QuoteStatus.DRAFT).length,
    finalized: quotes.filter(q => q.status === QuoteStatus.FINALIZED).length,
    won: quotes.filter(q => q.status === QuoteStatus.WON).length,
    lost: quotes.filter(q => q.status === QuoteStatus.LOST).length,
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.WON: return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case QuoteStatus.LOST: return 'text-slate-500 bg-slate-100 border-slate-200';
      case QuoteStatus.FINALIZED: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case QuoteStatus.DRAFT: return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // Actions
  const handleEdit = (quote: Quote) => {
      setCurrentQuote(quote);
      setIsEditing(true);
      setIsEditorPreviewOpen(false);
  };
  
  const handleCreateNew = () => {
      createQuote(settings);
      incrementDocNumber();
  };

  const handleDuplicate = (quote: Quote) => {
      duplicateQuote(quote, settings, incrementDocNumber, t);
  };

  const handleDelete = (id: string) => {
      deleteQuote(id, t);
  };

  const handleStatusUpdate = (e: React.MouseEvent, quote: Quote, newStatus: QuoteStatus) => {
    e.stopPropagation();
    updateQuoteStatus(quote, newStatus);
    setOpenStatusMenuId(null);
  };
  
  const currencySymbol = settings.defaultCurrency === 'KRW' ? '₩' : '$';

  // --- Board View Logic ---
  const boardColumns = [
    { id: QuoteStatus.DRAFT, label: t.col_draft, color: 'bg-amber-50 border-amber-200' },
    { id: QuoteStatus.FINALIZED, label: t.col_finalized, color: 'bg-emerald-50 border-emerald-200' },
    { id: QuoteStatus.WON, label: t.col_won, color: 'bg-indigo-50 border-indigo-200' },
    { id: QuoteStatus.LOST, label: t.col_lost, color: 'bg-slate-50 border-slate-200' },
  ];

  const getQuotesByStatus = (status: QuoteStatus) => {
     return quotes.filter(q => q.status === status && (
         q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
         q.number.toLowerCase().includes(searchTerm.toLowerCase())
     )).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 h-full flex flex-col" onClick={() => setOpenStatusMenuId(null)}>
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             {t.quotes} <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{quotes.length}</span>
           </h2>
           <p className="text-slate-400 text-xs font-medium mt-1">{t.workspaceSub}</p>
        </div>
        <div className="flex gap-3">
             <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                 <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t.viewList}
                 >
                    <List size={20} />
                 </button>
                 <button 
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t.viewBoard}
                 >
                    <Kanban size={20} />
                 </button>
             </div>
             <button 
                onClick={handleCreateNew} 
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 hover:shadow-lg shadow-indigo-200 transition-all active:scale-95"
             >
                <Plus size={18}/> <span className="hidden sm:inline">{t.newQuote}</span>
             </button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center shrink-0">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
               type="text" 
               placeholder={t.searchPlaceholder} 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
            />
         </div>
         {viewMode === 'list' && (
             <div 
               className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0 w-full md:w-auto overflow-x-auto"
               data-tutorial-id="tutorial-target-library-filters"
             >
                {(['all', QuoteStatus.DRAFT, QuoteStatus.FINALIZED, QuoteStatus.WON, QuoteStatus.LOST] as const).map(status => {
                   const isActive = filterStatus === status;
                   const count = status === 'all' ? stats.all : status === QuoteStatus.DRAFT ? stats.draft : status === QuoteStatus.FINALIZED ? stats.finalized : status === QuoteStatus.WON ? stats.won : stats.lost;
                   const label = status === 'all' ? t.filterAll : t[`status_${status}` as keyof typeof t];
                   
                   return (
                      <button
                         key={status}
                         onClick={() => setFilterStatus(status)}
                         className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            isActive 
                               ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                               : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                         }`}
                      >
                         {label}
                         <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-400'}`}>{count}</span>
                      </button>
                   )
                })}
             </div>
         )}
      </div>

      {/* 3. Content View (List or Board) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      {viewMode === 'list' ? (
          <div className="space-y-3 pb-20">
             {filteredQuotes.length === 0 ? (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                      <Inbox size={32} />
                   </div>
                   <div>
                      <h3 className="text-slate-900 font-bold text-lg mb-1">{searchTerm ? t.noSearchResults : t.noData}</h3>
                      <p className="text-slate-400 text-xs">{searchTerm ? '' : t.tutorialWelcomeDesc}</p>
                   </div>
                   {!searchTerm && (
                      <button onClick={handleCreateNew} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
                         {t.createNew} <ChevronRight size={14}/>
                      </button>
                   )}
                </div>
             ) : (
                filteredQuotes.map(quote => (
                   <div 
                      key={quote.id} 
                      className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer relative overflow-visible"
                      onClick={() => handleEdit(quote)}
                   >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl"></div>
    
                      <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border-2 ${getStatusColor(quote.status)}`}>
                         {quote.status === QuoteStatus.WON ? <ThumbsUp size={20}/> : 
                          quote.status === QuoteStatus.LOST ? <ThumbsDown size={20}/> :
                          quote.status === QuoteStatus.FINALIZED ? <CheckCircle2 size={20} /> : 
                          <Clock size={20} />}
                      </div>
    
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quote.number}</span>
                            {quote.status === QuoteStatus.DRAFT && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
                         </div>
                         <h3 className="text-lg font-black text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{quote.clientName || '(Untitled Client)'}</h3>
                      </div>
    
                      <div className="flex items-center gap-8 md:gap-12 w-full md:w-auto justify-between md:justify-end">
                         
                         {quote.status !== QuoteStatus.DRAFT && (
                            <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setOpenStatusMenuId(openStatusMenuId === quote.id ? null : quote.id); }}
                                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 hover:brightness-95 transition-all ${getStatusColor(quote.status)}`}
                                >
                                    {t[`status_${quote.status}` as keyof typeof t]} <ChevronDown size={12}/>
                                </button>
                                
                                {openStatusMenuId === quote.id && (
                                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-1">
                                            <button onClick={(e) => handleStatusUpdate(e, quote, QuoteStatus.WON)} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2">
                                                <ThumbsUp size={14}/> {t.markAsWon}
                                            </button>
                                            <button onClick={(e) => handleStatusUpdate(e, quote, QuoteStatus.LOST)} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                                <ThumbsDown size={14}/> {t.markAsLost}
                                            </button>
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button onClick={(e) => handleStatusUpdate(e, quote, QuoteStatus.FINALIZED)} className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2">
                                                <CheckCircle2 size={14}/> {t.status_Finalized}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         )}
    
                         <div className="flex flex-col items-end gap-1 min-w-[100px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><CreditCard size={10}/> {t.totalAmount}</span>
                            <span className="text-lg font-black text-slate-800 font-mono tracking-tight">
                               {currencySymbol}{quote.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()}
                            </span>
                         </div>
                      </div>
    
                      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity ml-auto pl-4 border-l border-slate-100">
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(quote); }} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title={t.duplicate}
                         >
                            <Copy size={16} />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(quote); }} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                         >
                            <ExternalLink size={16}/>
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(quote.id); }} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title={t.delete}
                         >
                            <Trash2 size={16}/>
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
      ) : (
          <div className="flex gap-4 h-full pb-6 overflow-x-auto custom-scrollbar snap-x snap-mandatory px-1">
             {boardColumns.map(col => {
                 const colQuotes = getQuotesByStatus(col.id);
                 return (
                     <div key={col.id} className="min-w-[280px] md:min-w-[320px] bg-slate-50/50 rounded-2xl flex flex-col border border-slate-200/60 snap-start h-full max-h-full">
                         {/* Column Header */}
                         <div className={`p-4 border-b border-slate-100 rounded-t-2xl flex justify-between items-center sticky top-0 bg-slate-50/95 backdrop-blur z-10 ${col.color}`}>
                             <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">{col.label}</h3>
                             <span className="text-xs font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded-full border border-slate-200/50">{colQuotes.length}</span>
                         </div>
                         
                         {/* Column Content */}
                         <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                             {colQuotes.map(quote => (
                                 <div 
                                     key={quote.id}
                                     onClick={() => handleEdit(quote)}
                                     className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                                 >
                                     <div className="flex justify-between items-start mb-2">
                                         <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{quote.number}</span>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(quote); }}
                                            className="text-slate-300 hover:text-indigo-600 transition-colors"
                                            aria-label="Open Quote"
                                         >
                                            <ExternalLink size={12} />
                                         </button>
                                     </div>
                                     <h4 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2">{quote.clientName || 'Untitled'}</h4>
                                     <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                                         <span className="text-[10px] text-slate-400">{quote.issueDate}</span>
                                         <span className="font-black text-slate-800 text-xs">
                                             {currencySymbol}{quote.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()}
                                         </span>
                                     </div>
                                     
                                     {/* Quick Actions overlay */}
                                     <div className="hidden group-hover:flex absolute inset-0 bg-white/90 backdrop-blur-[1px] rounded-xl items-center justify-center gap-2 animate-in fade-in duration-200">
                                         <button onClick={(e) => { e.stopPropagation(); handleEdit(quote); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:scale-110 transition-transform" aria-label="Edit"><ExternalLink size={16}/></button>
                                         <button onClick={(e) => { e.stopPropagation(); handleDuplicate(quote); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:scale-110 transition-transform" aria-label="Duplicate"><Copy size={16}/></button>
                                         <button onClick={(e) => { e.stopPropagation(); handleDelete(quote.id); }} className="p-2 bg-red-50 text-red-600 rounded-full hover:scale-110 transition-transform" aria-label="Delete"><Trash2 size={16}/></button>
                                     </div>
                                 </div>
                             ))}
                             {colQuotes.length === 0 && (
                                 <div className="text-center py-8 opacity-50">
                                     <div className="text-xs text-slate-400 font-medium italic">{t.emptyState}</div>
                                 </div>
                             )}
                         </div>
                     </div>
                 )
             })}
          </div>
      )}
      </div>
    </div>
  );
};
