import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportErrorToDeveloper } from './utils/errorReporter';

// Global listener for Uncaught Syntax Errors and Runtime Execution crashes
window.addEventListener('error', (event) => {
  reportErrorToDeveloper('Global Window Event Error', event.error || event.message);
});

// Global listener for async Promise logic crashing (like await Gemini/Firebase without try/catch)
window.addEventListener('unhandledrejection', (event) => {
  reportErrorToDeveloper('Unhandled Async Rejection', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
