import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline PWA support.
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}
