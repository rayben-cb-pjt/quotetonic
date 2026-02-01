
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QuoteEditor } from './components/QuoteEditor';
import { DocumentLibrary } from './components/DocumentLibrary';
import { TemplateCustomizer } from './components/TemplateCustomizer';
import { SettingsManager } from './components/SettingsManager';
import { Tutorial } from './components/Tutorial';
import { TemplateSelectionModal } from './components/TemplateSelectionModal';
import { TemplateId } from './types';
import { QuoteProvider, useQuotes } from './contexts/QuoteContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';

const AppContent = () => {
  const { activeTab, setActiveTab, isEditing, createQuote } = useQuotes();
  const { settings, updateSettings } = useSettings();
  const { showTutorial, tutorialStep, setStep } = useTutorial();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleCreateNew = (templateId?: TemplateId | string) => {
    // 1. Create the quote using context action
    createQuote(settings, templateId);

    // 2. Increment document number in settings
    updateSettings('nextDocNumber', (settings.nextDocNumber || 1001) + 1);

    // 3. Close modal if open
    setIsTemplateModalOpen(false);

    // 4. Handle Tutorial Progression
    if (showTutorial) {
        if (tutorialStep === 1) setStep(2); // From New Doc -> Template Step (if manual)
        if (tutorialStep === 2) setStep(3); // From Template -> Client Input
    }
  };

  // Sync Tabs with Tutorial Steps (Auto-navigation)
  useEffect(() => {
     if (!showTutorial) return;
     if (tutorialStep === 8) setActiveTab('quotes');
     if (tutorialStep === 10) setActiveTab('templates');
     if (tutorialStep === 12) setActiveTab('settings');
  }, [tutorialStep, showTutorial, setActiveTab]);

  return (
    <Layout onCreateNew={() => setIsTemplateModalOpen(true)}>
      <TemplateSelectionModal 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={(id) => handleCreateNew(id)}
        tutorialStep={showTutorial ? tutorialStep : undefined}
        tutorialLevel={settings.tutorialLevel}
      />

      {showTutorial && <Tutorial />}

      {isEditing ? (
        <QuoteEditor />
      ) : (
        <>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'quotes' && <DocumentLibrary />}
          {activeTab === 'templates' && <TemplateCustomizer />}
          {activeTab === 'settings' && <SettingsManager />}
        </>
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <QuoteProvider>
        <TutorialProvider>
          <AppContent />
        </TutorialProvider>
      </QuoteProvider>
    </SettingsProvider>
  );
}
