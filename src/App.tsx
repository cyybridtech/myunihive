import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import HostelListingPage from './pages/HostelListingPage';
import HostelDetailsPage from './pages/HostelDetailsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TermsPage from './pages/TermsPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import DebugPage from './pages/DebugPage';
import MessagesPage from './pages/MessagesPage';
import AddHostelPage from './pages/AddHostelPage';
import AddRoomPage from './pages/AddRoomPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect, type ReactNode } from 'react';
import InstallPWA from './components/InstallPWA';
import RoommateFinderPage from './pages/RoommateFinderPage';
import MaintenancePage from './pages/MaintenancePage';
import ProfilePage from './pages/ProfilePage';

// 🚧 Set to true for live under-development / maintenance mode
const MAINTENANCE_MODE = false;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// 🔥 Role-based dashboard selector
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user.role === 'manager' || user.role === 'hostel_manager') {
    return <ManagerDashboard />;
  }

  return <StudentDashboard />;
}

function RoleProtectedRoute({ children, allowedRoles, fallbackPath }: { children: ReactNode; allowedRoles: string[]; fallbackPath: string; }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

function AppLayout() {
  const { pathname, search } = useLocation();

  // Allow secret bypass via '?bypass=true' if you ever need to preview full app
  const searchParams = new URLSearchParams(search);
  const bypassParam = searchParams.get('bypass');
  if (bypassParam === 'true') {
    localStorage.setItem('bypass_maintenance', 'true');
  } else if (bypassParam === 'false') {
    localStorage.removeItem('bypass_maintenance');
  }

  const isBypassed = localStorage.getItem('bypass_maintenance') === 'true';

  if (MAINTENANCE_MODE && !isBypassed) {
    return <MaintenancePage />;
  }

  const hideNavbar = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}
      <ScrollToTop />
      <InstallPWA />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/homepage" element={<HomePage />} />

        <Route path="/hostels" element={<HostelListingPage />} />
        <Route path="/hostels/:id" element={<HostelDetailsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* ✅ FIXED DASHBOARD ROUTE */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* ✅ OPTIONAL: redirect old route */}
        <Route path="/studentdashboard" element={<Navigate to="/dashboard" />} />

        {/* ✅ USER PROFILE ROUTE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['admin']} fallbackPath="/manager">
                <AdminDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/debug"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['admin']} fallbackPath="/dashboard">
                <DebugPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['manager', 'hostel_manager']} fallbackPath="/dashboard">
                <ManagerDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/roommate-finder"
          element={
            <ProtectedRoute>
              <RoommateFinderPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/add-hostel"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['admin']} fallbackPath="/dashboard">
                <AddHostelPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-room"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['admin', 'manager', 'hostel_manager']} fallbackPath="/dashboard">
                <AddRoomPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppLayout />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}