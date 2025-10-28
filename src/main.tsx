import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
// import { initWebVitals } from './lib/webVitals';
import './index.css';

// Rejestracja Service Worker dla PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
      });
  });
}

// Inicjalizuj Web Vitals monitoring
// Wyłączone ze względu na problemy z WebContainer/StackBlitz
// window.addEventListener('load', () => {
//   initWebVitals(); // User ID zostanie dodany po zalogowaniu
// });

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: red;">Błąd ładowania aplikacji</h1>
      <p>Wystąpił błąd podczas uruchamiania aplikacji. Sprawdź konsolę przeglądarki.</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error}</pre>
    </div>
  `;
}
