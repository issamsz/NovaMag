import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './components/auth/LoginPage';
import PrintPreviewModal from './components/common/PrintPreviewModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getStoredUser, clearAuthSession } from './services/api';
import { LanguageProvider } from './i18n/LanguageContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NovaMag React Error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white select-none">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">
              Une erreur inattendue est survenue
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Erreur inconnue'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger NovaMag</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUser();
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      const user = getStoredUser();
      setCurrentUser(user);
    };
    window.addEventListener('novamag_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('novamag_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    window.dispatchEvent(new Event('novamag_user_updated'));
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        {currentUser ? (
          <MainLayout onLogout={handleLogout} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )}
        <PrintPreviewModal />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
