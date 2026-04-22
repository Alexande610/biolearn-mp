import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Analytics } from '@vercel/analytics/react';

// Molstar CSS cho molecular viewer
import 'molstar/lib/mol-plugin-ui/skin/light.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Analytics />
    <App />
  </React.StrictMode>
);
