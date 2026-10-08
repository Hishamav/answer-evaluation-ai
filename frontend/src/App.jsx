import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Evaluator from './pages/Evaluator';
import Departments from './pages/Departments';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Students from './pages/Students';
import Timetable from './pages/Timetable';
import EvaluationHistory from './pages/EvaluationHistory';
import About from './pages/About';
import Sidebar from './components/Sidebar';
import LogoLoader from './components/LogoLoader';
import Login from './components/Login';
import TopHeader from './components/TopHeader';
import StudentClassTimetable from './pages/StudentClassTimetable';
import StudentResults from './pages/StudentResults';
import StudentExamTimetable from './pages/StudentExamTimetable';
import { ToastProvider } from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import { LogOut } from 'lucide-react';
import './App.css';

function PageTransitionHandler({ setLoading, user, handleLogout, setUser }) {
  const location = useLocation();
  useEffect(() => {
    setLoading(true);
    
    // Verify user on navigation
    if (user && user.email) {
      fetch(`http://localhost:8000/api/verify/${user.email}`)
        .then(res => {
          if (!res.ok) handleLogout();
          else return res.json();
        })
        .then(data => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('evalai_user', JSON.stringify(data.user));
          }
        })

        .catch(() => {});
    }

    const timeout = setTimeout(() => setLoading(false), 2000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return null;
}

function AppContent() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('evalai_user');
    const token = localStorage.getItem('evalai_token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Verify on initial load
      fetch(`http://localhost:8000/api/verify/${parsedUser.email}`)
        .then(res => {
          if (!res.ok) {
            localStorage.removeItem('evalai_token');
            localStorage.removeItem('evalai_user');
            setUser(null);
          } else {
            return res.json();
          }
        })
        .then(data => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('evalai_user', JSON.stringify(data.user));
          }
        })

        .catch(() => {})
        .finally(() => setIsReady(true));
    } else {
      setIsReady(true);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('evalai_token');
    localStorage.removeItem('evalai_user');
    setUser(null);
    setShowLogoutModal(false);
  };

  if (!isReady) return <LogoLoader />;

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          user={user}
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
      <main className="main-content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        <PageTransitionHandler setLoading={setLoading} user={user} handleLogout={handleLogout} setUser={setUser} />
          <TopHeader 
            user={user} 
            onMenuClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }} 
            onLogoutTrigger={() => setShowLogoutModal(true)}
          />
        <div className="content-body" style={{ position: 'relative' }}>
          {loading && <LogoLoader message="Syncing Academic Stream..." />}
          <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.15s ease', height: '100%' }}>
            <Routes>
              {user?.role === 'student' ? (
                <>
                  <Route path="/" element={<Navigate to="/student-class-timetable" replace />} />
                  <Route path="/student-class-timetable" element={<StudentClassTimetable user={user} />} />
                  <Route path="/student-exam-timetable" element={<StudentExamTimetable user={user} />} />
                  <Route path="/student-results" element={<StudentResults user={user} />} />
                  <Route path="*" element={<Navigate to="/student-class-timetable" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/evaluate" element={<Evaluator />} />
                  <Route path="/evaluation-history" element={<EvaluationHistory />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/teachers" element={<Teachers />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/subjects" element={<Subjects />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/timetable" element={<Timetable user={user} />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </div>
        </div>

      </main>

      <ConfirmDialog 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Institutional Logout?"
        description="Are you sure you want to end your active evaluation session? All unsaved stream data will be synchronized."
        icon={<LogOut size={32} />}
        iconBgColor="#fff1f0"
        iconColor="#ff4d4f"
        confirmText="Confirm Logout"
        confirmBgColor="var(--primary-color)"
      />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;
