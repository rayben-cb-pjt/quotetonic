import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quote, QuoteStatus, TemplateId, ThemeConfig } from '../types';
import { THEME_PRESETS, UI_STRINGS } from '../constants';
import { AppSettings } from '../types'; // Needed for creating new quotes based on settings

// We need a way to access settings inside QuoteContext actions, 
// or pass settings into actions. 
// For better decoupling, we might pass necessary settings values as arguments to actions.

const QUOTES_STORAGE_KEY = 'quotetonic_quotes_v3';

interface QuoteContextType {
  quotes: Quote[];
  currentQuote: Quote | undefined;
  isEditing: boolean;
  isEditorPreviewOpen: boolean;
  activeTab: string;
  createQuote: (settings: AppSettings, templateId?: TemplateId | string) => void;
  saveQuote: (quote: Quote, shouldCloseEditor?: boolean) => void;
  deleteQuote: (id: string, t: any) => void; // t passed for confirmation message
  duplicateQuote: (quote: Quote, settings: AppSettings, updateSettingsNextNum: (n: number) => void, t: any) => void;
  updateQuoteStatus: (quote: Quote, newStatus: QuoteStatus) => void;
  setCurrentQuote: React.Dispatch<React.SetStateAction<Quote | undefined>>;
  setIsEditing: (isEditing: boolean) => void;
  setIsEditorPreviewOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function useQuotes() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
}

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem(QUOTES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentQuote, setCurrentQuote] = useState<Quote | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditorPreviewOpen, setIsEditorPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
  }, [quotes]);

  const saveQuote = (q: Quote, shouldCloseEditor = true) => {
    const exists = quotes.findIndex(x => x.id === q.id) > -1;
    if (exists) {
      setQuotes(prev => prev.map(item => item.id === q.id ? q : item));
    } else {
      setQuotes(prev => [q, ...prev]);
    }
    
    if (shouldCloseEditor) {
        setIsEditing(false);
        setIsEditorPreviewOpen(false);
        setActiveTab('quotes');
        setCurrentQuote(undefined); // Optional: clear current quote on save?
        // In original App.tsx, it didn't clear currentQuote explicitly but setIsEditing(false) made it disappear from view
    }
  };

  const deleteQuote = (id: string, t: any) => {
    if (confirm(t.deleteConfirm)) {
      setQuotes(prev => prev.filter(q => q.id !== id));
      if (currentQuote?.id === id) {
        setIsEditing(false);
        setCurrentQuote(undefined);
      }
    }
  };

  const updateQuoteStatus = (quote: Quote, newStatus: QuoteStatus) => {
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: newStatus } : q));
  };

  const duplicateQuote = (quote: Quote, settings: AppSettings, updateSettingsNextNum: (n: number) => void, t: any) => {
    const newQuote: Quote = {
      ...quote,
      id: Math.random().toString(36).substr(2, 9),
      number: `${settings.docNumberPrefix}${String(settings.nextDocNumber).padStart(6, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      status: QuoteStatus.DRAFT,
      clientName: `${quote.clientName} ${t.copySuffix}`
    };
    
    updateSettingsNextNum(settings.nextDocNumber + 1);

    setQuotes(prev => [newQuote, ...prev]);
    setCurrentQuote(newQuote);
    setIsEditing(true);
    setIsEditorPreviewOpen(false);
  };

  const createQuote = (settings: AppSettings, templateId?: TemplateId | string) => {
    const selectedTemplateId = (templateId as TemplateId) || settings.defaultTemplateId || 'standard';
    
    const docNumber = `${settings.docNumberPrefix || 'QT-'}${String(settings.nextDocNumber || 1001).padStart(6, '0')}`;
    
    // Counter increment should be handled by the caller/Settings context, 
    // but we can't easily sync state updates across contexts linearly without robust eventing.
    // For now, we will return the NEW quote object, and the caller handles side effects? 
    // Or we assume the caller passed a function to update settings.
    
    // Actually, createQuote in App.tsx did setSettings. 
    // We'll need a way for createQuote to trigger settings update.
    // We will Accept a callback or assume the SettingsContext exposes a method we can call?
    // BUT we don't want to couple contexts circularly. 
    // Best practice: Component calls both: createQuote() and updateSettings().
    
    const newQuote: Quote = {
      id: Math.random().toString(36).substr(2, 9),
      number: docNumber,
      clientName: '',
      clientEmail: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: settings.defaultCurrency,
      items: [{
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: settings.defaultTaxRate,
        discount: 0,
        discountType: 'amount'
      }],
      status: QuoteStatus.DRAFT,
      templateId: selectedTemplateId,
      theme: THEME_PRESETS[selectedTemplateId] || settings.theme,
      terms: settings.defaultTerms || '',
      notes: settings.defaultFooterNotes || '',
      language: settings.language // Use settings language for the quote
    };

    setCurrentQuote(newQuote);
    setIsEditing(true);
    setIsEditorPreviewOpen(false);
    // Modal handling is UI state, can be handled by caller or another UI context.
  };

  return (
    <QuoteContext.Provider value={{
      quotes,
      currentQuote,
      isEditing,
      isEditorPreviewOpen,
      activeTab,
      createQuote,
      saveQuote,
      deleteQuote,
      duplicateQuote,
      updateQuoteStatus,
      setCurrentQuote,
      setIsEditing,
      setIsEditorPreviewOpen,
      setActiveTab
    }}>
      {children}
    </QuoteContext.Provider>
  );
};
