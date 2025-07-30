
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker registration has been removed to prevent the app from getting stuck
// in development environments like AI Studio due to origin mismatch errors.
// It can be re-added later with more robust environment checks if PWA offline capabilities are critical.
