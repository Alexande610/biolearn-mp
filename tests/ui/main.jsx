import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthContext } from '../../src/hooks/useAuth';
import { useOnlinePresence } from '../../src/hooks/useOnlinePresence';
import { ToastProvider } from '../../src/components/Toast';
import SystemErrorBoundary from '../../src/components/SystemErrorBoundary';
import AdminPage from '../../src/pages/AdminPage';
import AdminLogsPage from '../../src/pages/AdminLogsPage';
import '../../src/index.css';

export function Fixture() {
  const [identity, setIdentity] = useState('test-admin');
  const onlinePresence = useOnlinePresence(identity);
  return <AuthContext.Provider value={{ user: { id: identity, role: 'admin' }, theme: 'dark', toggleTheme() {}, onlinePresence }}>
    <ToastProvider><BrowserRouter>
      <nav style={{ background: '#111', color: 'white', padding: 16, display: 'flex', gap: 24 }}>
        <strong>DỮ LIỆU GIẢ LẬP · KHÔNG KẾT NỐI DATABASE</strong>
        <Link to="/admin">Admin</Link><Link to="/admin/logs">Logs</Link>
        <button onClick={() => setIdentity(value => value === 'test-admin' ? 'test-admin-2' : 'test-admin')}>Đổi tài khoản giả lập</button>
      </nav>
      <Routes><Route path="/admin/logs" element={<AdminLogsPage />} /><Route path="*" element={<AdminPage />} /></Routes>
    </BrowserRouter></ToastProvider>
  </AuthContext.Provider>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><SystemErrorBoundary><Fixture /></SystemErrorBoundary></React.StrictMode>);
