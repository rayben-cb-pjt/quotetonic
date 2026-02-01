import React, { useState } from 'react';
import { NAVIGATION_ITEMS, UI_STRINGS } from '../constants';
import { Menu, X, Globe, Info, PlusCircle, HelpCircle, BookOpen } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTutorial } from '../contexts/TutorialContext';
import { useQuotes } from '../contexts/QuoteContext';

interface LayoutProps {
  children: React.ReactNode;
  onCreateNew?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onCreateNew,
}) => {
  const { settings, updateSettings, lang } = useSettings();
  const { showTutorial, toggleTutorial } = useTutorial();
  const { activeTab, setActiveTab, isEditing, setIsEditing } = useQuotes();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Safe access to UI Strings with explicit fallback to English if missing
  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['ko'] || UI_STRINGS?.['en'];
  
  const safeT = t || { 
     quickCreate: 'Quick Create', 
     restartGuide: 'Guide', 
     serviceInfo: 'Service Info', 
     serviceFooter: 'Footer',
     documentEditor: 'Editor'
  } as any;

  // Design Center (templates) needs full screen layout without padding
  const isFullWidthPage = activeTab === 'templates';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm z-20`}>
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-100 shadow-lg shrink-0">Q</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-slate-800 truncate">QuoteTonic</span>}
        </div>

        {/* Quick Action */}
        <div className="px-3 mb-2 shrink-0">
           <button 
              onClick={onCreateNew}
              className={`w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isSidebarOpen ? 'px-4' : 'px-0'}`}
              title={safeT.quickCreate}
           >
              <PlusCircle size={20} />
              {isSidebarOpen && <span className="font-black text-xs uppercase tracking-wider">{safeT.quickCreate}</span>}
           </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {NAVIGATION_ITEMS.map((item) => {
            const label = safeT[item.id as keyof typeof safeT] || item.label;
            const isActive = activeTab === item.id && !isEditing;

            return (
              <button
                key={item.id}
                data-tutorial-id={`tutorial-target-nav-${item.id}`} // Added for tutorial targeting
                onClick={() => {
                  setIsEditing(false);
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
          {/* Guide Toggle Button */}
          <button 
            onClick={toggleTutorial}
            className={`w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group ${showTutorial ? 'bg-indigo-50 text-indigo-600' : ''}`}
            title={safeT.restartGuide}
          >
            <BookOpen size={18} className={`shrink-0 ${showTutorial ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
            {isSidebarOpen && (
              <span className="text-xs font-medium">
                {safeT.restartGuide} {showTutorial ? '(On)' : ''}
              </span>
            )}
          </button>

          <button 
            onClick={() => updateSettings('language', lang === 'en' ? 'ko' : 'en')}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group"
          >
            <Globe size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
            {isSidebarOpen && (
              <span className="text-xs font-medium">
                {lang === 'en' ? '한국어' : 'English'}
              </span>
            )}
          </button>
          

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {isEditing ? safeT.documentEditor : (safeT[activeTab as keyof typeof safeT] || activeTab)}
            </h1>
          </div>
        </header>

        {/* 
            Modified Main Container: 
            If isFullWidthPage (Design Center), we remove padding and disable main scrolling 
            so the inner component can handle full height layout itself.
        */}
        <main className={`flex-1 flex flex-col min-w-0 relative ${isFullWidthPage ? 'overflow-hidden p-0' : 'overflow-y-auto p-8 custom-scrollbar'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
