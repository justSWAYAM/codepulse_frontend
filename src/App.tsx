import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppShell from './layouts/AppShell';
import DashboardHome from './pages/DashboardHome';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import { QuestionCreatePage } from './pages/QuestionCreatePage';
import { QuestionEditPage } from './pages/QuestionEditPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated shell */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />

            {/* Question routes — nested under a specific contest */}
            <Route
              path="contests/:contestId/questions/new"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <QuestionCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="contests/:contestId/questions/:questionId/edit"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <QuestionEditPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all → redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ReactLenis>
  );
};

export default App;
