import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AiAssistantDock } from './components/AiAssistantDock';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { apiFetch } from './lib/api';
import { SafeUser } from '@wb-sso/types';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Session and current user query
  const {
    data: authData,
    isLoading,
    refetch,
  } = useQuery<{ user: SafeUser }>({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: SafeUser }>('me'),
    retry: false,
  });

  const currentUser = authData?.user || null;

  const handleLogout = async () => {
    try {
      await apiFetch('auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      queryClient.clear();
      navigate('/');
      refetch();
    }
  };

  const handleLoginSuccess = (user: SafeUser) => {
    queryClient.setQueryData(['me'], { user });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#070D18] text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-300 font-sans selection:bg-[#FF7A00] selection:text-white">
      <Header user={currentUser} onLogout={handleLogout} />

      <main id="main-content" className="flex-1 flex flex-col">
        <Routes>
          <Route
            path="/"
            element={
              currentUser ? (
                <DashboardPage />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/profile"
            element={
              currentUser ? (
                <ProfilePage user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              currentUser && currentUser.userType === 'ADMIN' ? (
                <AdminPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <AiAssistantDock />
      {currentUser && <SessionTimeoutModal onLogout={handleLogout} />}
    </div>
  );
};
