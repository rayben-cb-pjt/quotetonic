import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import { QuoteProvider } from './contexts/QuoteContext';
import { TutorialProvider } from './contexts/TutorialContext';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SettingsProvider>
        <QuoteProvider>
          <TutorialProvider>
            <App />
          </TutorialProvider>
        </QuoteProvider>
      </SettingsProvider>
    </React.StrictMode>
  );
}
