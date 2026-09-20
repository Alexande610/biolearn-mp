import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Analytics } from '@vercel/analytics/react';
import SystemErrorBoundary from './components/SystemErrorBoundary';
import { installGlobalErrorMonitoring } from './lib/observability';

// Molstar CSS cho molecular viewer
import 'molstar/lib/mol-plugin-ui/skin/light.scss';

installGlobalErrorMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SystemErrorBoundary>
      <Analytics />
      <App />
    </SystemErrorBoundary>
  </React.StrictMode>
);
