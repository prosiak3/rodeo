import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New version available, reloading...');
                window.location.reload();
              }
            });
          }
        });

        registration.update();
      })
      .catch((error) => {
        console.log('[SW] Service Worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
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
