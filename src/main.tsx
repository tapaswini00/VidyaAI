import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import { AndroidPermissionProvider } from './context/AndroidPermissionContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LanguageProvider>
        <AndroidPermissionProvider>
          <App />
        </AndroidPermissionProvider>
      </LanguageProvider>
    </HashRouter>
  </StrictMode>,
);


