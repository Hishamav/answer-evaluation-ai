import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Settings, Menu, LogOut, User as UserIcon, ChevronDown, X } from 'lucide-react';

import ConfirmDialog from './ConfirmDialog';

const TopHeader = ({ user, onMenuClick, onLogoutTrigger }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogoutClick = () => {
    setShowDropdown(false);
    onLogoutTrigger();
  };

  const [showSecurity, setShowSecurity] = useState(false);
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
  const [passSubmitting, setPassSubmitting] = useState(false);

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
        alert("New passwords do not match!"); return;
    }
    setPassSubmitting(true);
    try {
        const res = await fetch(`http://localhost:8000/api/change-password/${user.email}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: passForm.old, new_password: passForm.new })
        });
        const data = await res.json();
        if (res.ok) {
            alert("Password updated successfully!");
            setShowSecurity(false);
            setPassForm({ old: '', new: '', confirm: '' });
        } else {
            alert(data.detail || "Failed to update password");
        }
    } catch {
        alert("Network error");
    } finally {
        setPassSubmitting(false);
    }
  };


  return (
    <>
      <header className="sticky-header">

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger-menu-btn" onClick={onMenuClick}>
              <Menu size={24} />
            </button>
            <div className="header-search" style={{ position: 'relative', width: '320px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search assessments, records..." 
              style={{ 
                paddingLeft: '40px', 
                background: '#f1f5f9', 
                border: 'none', 
                borderRadius: '10px',
                fontSize: '0.85rem'
              }} 
            />
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="icon-btn-header" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
               <Bell size={20} />
            </button>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
            
            <div className="header-user-wrapper" style={{ position: 'relative' }}>
              <div 
                className="header-user" 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role ? `${user.role} Evaluator` : 'Principal Evaluator'}</div>
                 </div>
                 <div className="user-avatar-top">
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user?.name?.[0] || 'A'
                    )}
                 </div>

                 <ChevronDown size={14} style={{ opacity: 0.5 }} />
              </div>

              {showDropdown && (
                <div className="header-dropdown-menu">
                  <div className="dropdown-info">
                    <p>{user?.email}</p>
                  </div>
                  <button className="dropdown-item" onClick={() => { setShowDropdown(false); setShowSecurity(true); }}>
                    <UserIcon size={16} /> <span>Security Hub</span>
                  </button>

                  <button className="dropdown-item">
                    <Settings size={16} /> <span>Interface Settings</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-option" onClick={handleLogoutClick}>
                    <LogOut size={16} /> <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showSecurity && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ width: '400px', padding: '0' }}>
            <div className="modal-header">
               <div className="header-title">
                  <div className="title-icon"><Settings size={20} /></div>
                  <h3>Security Hub</h3>
               </div>
               <button className="close-modal" onClick={() => setShowSecurity(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handlePassChange} style={{ padding: '24px' }}>
               <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                  Manage your institutional credentials. Ensure your new password is at least 8 characters long.
               </p>
               <div className="form-group">
                  <label>Current Password</label>
                  <input 
                      type="password" 
                      placeholder="Enter current password" 
                      value={passForm.old} 
                      onChange={e => setPassForm({...passForm, old: e.target.value})}
                      required 
                  />
               </div>
               <div className="form-group">
                  <label>New Password</label>
                  <input 
                      type="password" 
                      placeholder="Minimum 8 characters" 
                      value={passForm.new} 
                      onChange={e => setPassForm({...passForm, new: e.target.value})}
                      required 
                  />
               </div>
               <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                      type="password" 
                      placeholder="Repeat new password" 
                      value={passForm.confirm} 
                      onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                      required 
                  />
               </div>
               <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSecurity(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={passSubmitting}>
                     {passSubmitting ? 'Updating...' : 'Change Password'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

}


export default TopHeader;
