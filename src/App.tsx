import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppShell from './layouts/AppShell';
import DashboardHome from './pages/DashboardHome';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import { QuestionCreatePage } from './pages/QuestionCreatePage';
import { QuestionEditPage } from './pages/QuestionEditPage';
import ContestListPage from './pages/ContestListPage';
import ContestCreatePage from './pages/ContestCreatePage';
import ContestDetailPage from './pages/ContestDetailPage';
import AssessmentPage from './pages/AssessmentPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

const App: React.FC = () => {
  return (
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

            {/* Contest routes */}
            <Route path="contests" element={<ContestListPage />} />
            <Route
              path="contests/new"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <ContestCreatePage />
                </ProtectedRoute>
              }
            />
            <Route path="contests/:id" element={<ContestDetailPage />} />

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

          {/* Assessment page — outside AppShell (focus-mode, no sidebar) */}
          <Route
            path="/dashboard/contests/:contestId/assessment"
            element={
              <ProtectedRoute roles={['CANDIDATE']}>
                <AssessmentPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all → redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
  );
};

export default App;

