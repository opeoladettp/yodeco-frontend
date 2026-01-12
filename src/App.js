import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './components/auth';
import { Navigation } from './components/layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import VotingPage from './pages/VotingPage';
import ContentManagementPage from './pages/ContentManagementPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MemberRegistrationPage from './pages/MemberRegistrationPage';
import MemberProfilePage from './pages/MemberProfilePage';
import AdminMembersPage from './pages/AdminMembersPage';
import ScrollbarTest from './components/test/ScrollbarTest';
import './styles/globals.css';
import './App.css';

function App() {
  const handleContactSupport = (errorId) => {
    // In a real application, this would open a support ticket or contact form
    const subject = encodeURIComponent(`Error Report - ${errorId}`);
    const body = encodeURIComponent(`I encountered an error with ID: ${errorId}\n\nPlease provide additional details about what you were doing when this error occurred.`);
    window.open(`mailto:support@votingportal.com?subject=${subject}&body=${body}`);
  };

  return (
    <ErrorBoundary
      title="Application Error"
      message="The voting portal encountered an unexpected error. Please try refreshing the page or contact support if the problem persists."
      onContactSupport={handleContactSupport}
    >
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="App">
            <ErrorBoundary
              title="Navigation Error"
              message="There was an error loading the navigation. Please refresh the page."
            >
              <Navigation />
            </ErrorBoundary>
            
            <main className="main-content">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary
                      title="Voting System Error"
                      message="There was an error loading the voting system. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <ProtectedRoute>
                        <VotingPage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/landing" 
                  element={
                    <ErrorBoundary
                      title="Landing Page Error"
                      message="There was an error loading the landing page. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <LandingPage />
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/manage" 
                  element={
                    <ErrorBoundary
                      title="Content Management Error"
                      message="There was an error loading the content management system. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <ProtectedRoute requiredRole="Panelist">
                        <ContentManagementPage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/admin" 
                  element={
                    <ErrorBoundary
                      title="Admin Dashboard Error"
                      message="There was an error loading the admin dashboard. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <ProtectedRoute requiredRole="System_Admin">
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } 
                />
                
                {/* Member Registration Routes */}
                <Route 
                  path="/member/register" 
                  element={
                    <ErrorBoundary
                      title="Member Registration Error"
                      message="There was an error loading the member registration page. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <MemberRegistrationPage />
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/member/profile/:id" 
                  element={
                    <ErrorBoundary
                      title="Member Profile Error"
                      message="There was an error loading the member profile. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <MemberProfilePage />
                    </ErrorBoundary>
                  } 
                />
                
                {/* Admin Member Management Routes */}
                <Route 
                  path="/admin/members" 
                  element={
                    <ErrorBoundary
                      title="Member Management Error"
                      message="There was an error loading the member management system. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <ProtectedRoute requiredRole="System_Admin">
                        <AdminMembersPage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/admin/members/:id" 
                  element={
                    <ErrorBoundary
                      title="Member Profile Error"
                      message="There was an error loading the member profile. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <ProtectedRoute requiredRole="System_Admin">
                        <MemberProfilePage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/admin/members/:id/edit" 
                  element={
                    <ErrorBoundary
                      title="Member Profile Error"
                      message="There was an error loading the member profile. Please try again or contact support."
                      onContactSupport={handleContactSupport}
                    >
                      <ProtectedRoute requiredRole="System_Admin">
                        <MemberProfilePage />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } 
                />
                
                <Route 
                  path="/scrollbar-test" 
                  element={
                    <ErrorBoundary
                      title="Scrollbar Test Error"
                      message="There was an error loading the scrollbar test page."
                    >
                      <ScrollbarTest />
                    </ErrorBoundary>
                  } 
                />
              </Routes>
            </main>
            
            <footer className="footer">
              <p>&copy; {new Date().getFullYear()} Youth Democratic Coalition (YODECO) Voting Portal. All rights reserved.</p>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;