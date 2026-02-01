import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppSettings, Language, ThemeConfig } from '../types';
import { THEME_PRESETS } from '../constants';

const SETTINGS_STORAGE_KEY = 'quotetonic_settings_v3';

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: 'USD',
  defaultTaxRate: 8.875,
  defaultTemplateId: 'standard',
  theme: THEME_PRESETS.standard,
  companyName: 'Acme Corp',
  representativeName: 'John Doe',
  companyAddress: 'New York, NY, USA',
  companyRegNo: '12-3456789',
  companyEmail: 'contact@acmecorp.com',
  companyPhone: '+1 (555) 123-4567',
  bankInfo: 'Chase Bank: 000-0000-0000',
  companyLogo: '',
  companySeal: '',
  businessType: 'Service',
  businessItem: 'IT Consulting',
  customFields: [],
  language: 'en',
  hasSeenTutorial: false,
  tutorialLevel: 'basic',
  tutorialStep: 0,
  monthlyGoal: 50000,
  defaultTerms: '',
  defaultFooterNotes: '',
  docNumberPrefix: 'QT-',
  nextDocNumber: 1001
};

interface SettingsContextType {
  settings: AppSettings;
  lang: Language;
  setLang: (lang: Language) => void;
  updateSettings: (field: keyof AppSettings, value: any) => void;
  updateThemeField: (field: keyof ThemeConfig, value: any) => void;
  incrementDocNumber: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
      if (!parsed.language || (parsed.language !== 'en' && parsed.language !== 'ko')) {
          parsed.language = 'en';
      }
      return parsed;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [lang, setLangState] = useState<Language>(settings.language || 'en');

  useEffect(() => {
    if (settings.language !== lang) {
        setLangState(settings.language);
    }
  }, [settings.language]);

  const setLang = (newLang: Language) => {
      setLangState(newLang);
      updateSettings('language', newLang);
  };

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((field: keyof AppSettings, value: any) => {
    setSettings(p => ({ ...p, [field]: value }));
  }, []);

  const updateThemeField = useCallback((field: keyof ThemeConfig, value: any) => {
    setSettings(p => ({ ...p, theme: { ...p.theme, [field]: value } }));
  }, []);

  const incrementDocNumber = useCallback(() => {
    setSettings(prev => ({
        ...prev, 
        nextDocNumber: (prev.nextDocNumber || 1001) + 1
    }));
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      lang,
      setLang,
      updateSettings,
      updateThemeField,
      incrementDocNumber
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
