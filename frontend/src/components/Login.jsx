import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, Globe, Award, Zap } from 'lucide-react';
import { useToast } from './Toast';
import logoIcon from '../assets/logo only.png';
import SubmitButton from './SubmitButton';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email,
        password,
      });

      if (response.data.status === 'success') {
        localStorage.setItem('evalai_token', response.data.token);
        localStorage.setItem('evalai_user', JSON.stringify(response.data.user));
        toast.success("Identity Verified", `Welcome back, ${response.data.user.name}`);
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.detail || 'Identity verification failed.';
      setError(msg);
      toast.error("Auth Failure", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Tech Stack */}
      <div className="bg-gradient-shapes">
        <div className="shape s1"></div>
        <div className="shape s2"></div>
        <div className="shape s3"></div>
      </div>

      <div className="login-card-glass">
        <div className="login-branding-section">
          <div className="branding-glass-bg"></div>
          <div className="brand-header">
            <div className="login-logo-nexus">
               <div className="logo-nexus-core">
                 <img src={logoIcon} alt="Nexus AI" className="sidebar-icon-only" />
               </div>
               <div className="brand-text-nexus">
                 EvalAI <span>Nexus</span>
               </div>
            </div>
            <p className="tagline">Cognitive Semantic Assessment Orchestrator</p>
          </div>

          <div className="brand-features">
            <div className="feat-item">
              <Zap size={16} />
              <span>Real-time Neural Evaluation</span>
            </div>
            <div className="feat-item">
              <ShieldCheck size={16} />
              <span>Level 3 Data Encryption</span>
            </div>
          </div>

          <div className="visual-footer">
            <div className="badge-row">
              <div className="mini-badge"><Globe size={12}/> Global Node</div>
              <div className="mini-badge"><Award size={12}/> AI Certified</div>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="form-inner">
            <header>
              <h2>Authenticate</h2>
              <p>Sign in to your institutional workspace</p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="input-group-premium">
                <label>Institutional Email</label>
                <div className="input-field-wrapper">
                  <Mail className="f-icon" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@institution.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="input-focus-ring"></div>
                </div>
              </div>

              <div className="input-group-premium">
                <label>Access Key</label>
                <div className="input-field-wrapper">
                  <Lock className="f-icon" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="input-focus-ring"></div>
                </div>
              </div>

              <div className="form-meta">
                <label className="checkbox-custom">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  <span>Keep Session Active</span>
                </label>
                <a href="#" className="link-primary">Need Access?</a>
              </div>

              {error && <div className="error-pulse">{error}</div>}

              <SubmitButton 
                loading={loading} 
                text="Initialize Portal" 
                loadingText="Authenticating..." 
                icon={<LogIn size={18} />} 
                className="btn-glow-primary"
                style={{ width: '100%' }}
              />
            </form>

            <footer className="form-legal">
              <p>© 2026 EvalAI Intelligence Systems. <br/>Part of the Neural Assessment Initiative.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
