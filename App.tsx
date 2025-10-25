
import React from 'react';
// FIX: Upgrading react-router-dom from v5 to v6.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import SimDetailsPage from './pages/SimDetailsPage';
import Header from './components/Header';
import Footer from './components/Footer';
import RondNumbersPage from './pages/RondNumbersPage';
import AuctionsPage from './pages/AuctionsPage';
import PackagesPage from './pages/PackagesPage';
import CarrierSimsPage from './pages/CarrierSimsPage';
import { isSupabaseConfigured } from './services/supabaseClient';
import { ConfigurationNotice } from './components/ConfigurationNotice';


// FIX: Cannot find namespace 'JSX'. Replaced JSX.Element with React.ReactElement.
// FIX: Replaced v5 <Redirect> with v6 <Navigate>.
const PrivateRoute: React.FC<{ children: React.ReactElement; roles: string[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Display a loading state while session is being verified.
    // This prevents a redirect flash on page refresh for logged-in users.
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AppContent: React.FC = () => {
  return (
      <HashRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {/* FIX: Replaced v5 <Switch> with v6 <Routes> and updated Route syntax. */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/sim/:id" element={<SimDetailsPage />} />
              <Route path="/rond-numbers" element={<RondNumbersPage />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/carrier/:carrierName" element={<CarrierSimsPage />} />
              
              <Route
                path="/admin/*"
                element={
                  <PrivateRoute roles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/seller/*"
                element={
                  <PrivateRoute roles={['seller']}>
                    <SellerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/buyer/*"
                element={
                  <PrivateRoute roles={['buyer']}>
                    <BuyerDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
  );
};


const App: React.FC = () => {
  if (!isSupabaseConfigured) {
    return <ConfigurationNotice />;
  }
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;