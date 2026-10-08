import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileSearch, 
  HelpCircle, 
  LogOut, 
  User, 
  Building2, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Award,
  History
} from 'lucide-react';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import logoIcon from '../assets/logo only.png';

const Sidebar = ({ user, isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const isStudent = user?.role === 'student';
  return (
    <div className="sidebar">

      <div className="sidebar-branding-row">
        <NavLink to="/" className="sidebar-logo-nexus">
           <div className="logo-nexus-core">
             <img src={logoIcon} alt="Nexus AI" className="sidebar-icon-only" />
           </div>
           {!isCollapsed && (
             <div className="brand-text-nexus">
               EvalAI <span>Nexus</span>
             </div>
           )}
        </NavLink>

        {/* Mobile Close Button */}
        <button className="sidebar-mobile-close" onClick={() => setIsOpen(false)}>
          <X size={20} />
        </button>

        {/* Top Collapse Button */}
        {!isCollapsed && (
          <button className="sidebar-collapse-toggle top-btn" onClick={() => setIsCollapsed(true)}>
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <div className="nav-menu">
        {isStudent ? (
          <>
            <NavLink to="/student-class-timetable" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <Calendar size={20} /> {!isCollapsed && <span>Class Timetable</span>}
            </NavLink>
            <NavLink to="/student-results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <Award size={20} /> {!isCollapsed && <span>My Results</span>}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <LayoutDashboard size={20} /> {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to="/departments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <Building2 size={20} /> {!isCollapsed && <span>Depts & Courses</span>}
            </NavLink>
            <NavLink to="/teachers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <Users size={20} /> {!isCollapsed && <span>Teachers Registry</span>}
            </NavLink>
            <NavLink to="/timetable" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <Calendar size={20} /> {!isCollapsed && <span>Timetable</span>}
            </NavLink>
            <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <GraduationCap size={20} /> {!isCollapsed && <span>Classes</span>}
            </NavLink>
            <NavLink to="/subjects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <BookOpen size={20} /> {!isCollapsed && <span>Subjects</span>}
            </NavLink>
            <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <Users size={20} /> {!isCollapsed && <span>Students</span>}
            </NavLink>
            <NavLink to="/evaluate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <FileSearch size={20} /> {!isCollapsed && <span>Evaluator</span>}
            </NavLink>
            <NavLink to="/evaluation-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <History size={20} /> {!isCollapsed && <span>Evaluation History</span>}
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} onClick={() => window.innerWidth < 768 && setIsOpen(false)}>
              <HelpCircle size={20} /> {!isCollapsed && <span>Help & Info</span>}
            </NavLink>
          </>
        )}
      </div>

      <div className="sidebar-footer-controls">
        {/* Bottom Expand Button - only visible when collapsed */}
        {isCollapsed && (
          <button className="sidebar-collapse-toggle bottom-btn" onClick={() => setIsCollapsed(false)}>
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
