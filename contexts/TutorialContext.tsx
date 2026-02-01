import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useQuotes } from './QuoteContext';
import { QuoteStatus } from '../types';

interface TutorialContextType {
  showTutorial: boolean;
  tutorialStep: number;
  startTutorial: () => void;
  stopTutorial: () => void;
  toggleTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const { settings, updateSettings } = useSettings();
  const { 
    activeTab, 
    setActiveTab, 
    createQuote, 
    setIsEditing, 
    setIsEditorPreviewOpen, 
    currentQuote, 
    saveQuote, 
    setCurrentQuote 
  } = useQuotes();

  const [showTutorial, setShowTutorial] = useState(!settings.hasSeenTutorial);
  const [tutorialStep, setTutorialStep] = useState(settings.tutorialStep || 0);

  // Sync tutorial step with settings if needed, or just keep in local state until save?
  // The original app didn't seem to persist step to settings aggressively, but it had 'tutorialStep' in AppSettings type.
  // The extract below uses local state for step primarily, but syncs on mount? 
  // Actually original code was: const [tutorialStep, setTutorialStep] = useState(0); 
  // It didn't seem to load from settings.tutorialStep initially, only passed it to child components.
  
  const startTutorial = () => {
    setActiveTab('dashboard');
    setTutorialStep(1);
    setShowTutorial(true);
  };

  const stopTutorial = () => {
    setShowTutorial(false);
    updateSettings('hasSeenTutorial', true);
  };

  const toggleTutorial = () => {
    if (showTutorial) {
      stopTutorial();
    } else {
      setShowTutorial(true);
      setTutorialStep(0);
      setActiveTab('dashboard');
      setIsEditing(false);
      setIsEditorPreviewOpen(false);
      setCurrentQuote(undefined);
    }
  };

  const setStep = (step: number) => {
      setTutorialStep(step);
  };

  const nextStep = () => {
    if (tutorialStep === 1) {
      if (activeTab !== 'dashboard') setActiveTab('dashboard');
      // Trigger creation
      // We need to know if we are in a state where we can simple call createQuote.
      // In App.tsx handleCreateNew() was managing step transitions.
      // Here, the tutorial controller drives the app state.
      createQuote(settings); 
      setTutorialStep(2);
    } else if (tutorialStep === 2) {
      // User supposedly selected template. 
      // In App.tsx, handleCreateNew('standard') was called.
      // We can force a template selection or simulate it.
      // Or we wait for the user action?
      // The original App.tsx handleGuideNext called handleCreateNew('standard').
      createQuote(settings, 'standard');
      setTutorialStep(3);
    } else if (tutorialStep === 6) {
       setIsEditorPreviewOpen(true);
       setTutorialStep(7);
    } else if (tutorialStep === 7) {
       if (currentQuote) {
           saveQuote({ ...currentQuote, status: QuoteStatus.FINALIZED });
           setTutorialStep(8); // saveQuote moves to 'quotes' tab in context?
       } else {
           setActiveTab('quotes');
           setTutorialStep(8);
       }
    } else if (tutorialStep === 8) {
       setActiveTab('quotes');
       setTutorialStep(9);
    } else if (tutorialStep === 9) {
       setTutorialStep(10);
    } else if (tutorialStep === 10) {
       setActiveTab('templates');
       setTutorialStep(11);
    } else if (tutorialStep === 11) {
       setTutorialStep(12);
    } else if (tutorialStep === 12) {
       setActiveTab('settings');
       setTutorialStep(13);
    } else if (tutorialStep === 13) {
       setTutorialStep(14);
    } else if (tutorialStep === 14) {
       setTutorialStep(15);
    } else if (tutorialStep === 15) {
       setTutorialStep(16);
    } else if (tutorialStep === 16) {
       setTutorialStep(17);
    } else if (tutorialStep === 17) {
       stopTutorial();
    } else {
       setTutorialStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
      const prev = tutorialStep - 1;
      if (prev < 1) return;

      setTutorialStep(prev);

      switch (prev) {
          case 1:
              setIsEditing(false);
              setActiveTab('dashboard');
              break;
          case 2:
              // Template selection modal state is tricky. 
              // We might need to expose setTemplateModalOpen in QuoteContext?
              setIsEditing(false);
              setActiveTab('dashboard');
              // QuoteContext doesn't manage modal open state yet. 
              // We might need to handle this via UI signals or just let the user be.
              break;
          case 3:
          case 4:
          case 5:
          case 6:
              setIsEditing(true);
              setIsEditorPreviewOpen(false);
              break;
          case 7:
              setIsEditing(true);
              setIsEditorPreviewOpen(true);
              break;
          case 8:
              setIsEditorPreviewOpen(false);
              setIsEditing(false);
              break;
          case 9:
              setActiveTab('quotes');
              break;
          case 10:
              setActiveTab('quotes'); 
              break;
          case 11:
          case 12:
              setActiveTab('templates');
              break;
          case 13:
          case 14:
          case 15:
          case 16:
              setActiveTab('settings');
              break;
      }
  };

  return (
    <TutorialContext.Provider value={{
      showTutorial,
      tutorialStep,
      startTutorial,
      stopTutorial,
      toggleTutorial,
      nextStep,
      prevStep,
      setStep
    }}>
      {children}
    </TutorialContext.Provider>
  );
};
