import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Lock, User, LogOut, ShieldCheck, Mail, ArrowRight, Loader2, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api/auth';
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard', '2fa-verify'

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/profile`);
      setUser(res.data);
      setView('dashboard');
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`);
      setUser(null);
      setView('login');
      toast.success('Logged out');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, view, setView, logout }}>
      <div className="app-container">
        <Toaster position="top-right" />
        <AnimatePresence mode="wait">
          {view === 'login' && <Login key="login" />}
          {view === 'register' && <Register key="register" />}
          {view === 'dashboard' && <Dashboard key="dashboard" />}
          {view === '2fa-verify' && <TwoFactorVerify key="2fa-verify" />}
        </AnimatePresence>
      </div>
    </AuthContext.Provider>
  );
}

// --- Components ---

function Login() {
  const { setUser, setView } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/login`, form);
      if (res.data.require2FA) {
        setView('2fa-verify');
      } else {
        setUser(res.data);
        setView('dashboard');
        toast.success(`Welcome back, ${res.data.username}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card"
    >
      <h1>CyAuth</h1>
      <p className="subtitle">Secure access to your intelligence</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <div className="input-wrapper">
            <User size={18} style={{ position: 'absolute', left: '12px', color: '#6366f1' }} />
            <input 
              type="text" 
              style={{ paddingLeft: '40px' }}
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={18} style={{ position: 'absolute', left: '12px', color: '#6366f1' }} />
            <input 
              type="password" 
              style={{ paddingLeft: '40px' }}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin m-auto" size={20} /> : 'Access Account'}
        </button>
      </form>

      <button className="link-btn" onClick={() => setView('register')}>
        New here? Create a secure identity
      </button>
    </motion.div>
  );
}

function Register() {
  const { setView } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/register`, form);
      toast.success('Account created! Please login.');
      setView('login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card"
    >
      <h1>Join CyAuth</h1>
      <p className="subtitle">Start your secure journey today</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <div className="input-wrapper">
            <User size={18} style={{ position: 'absolute', left: '12px', color: '#6366f1' }} />
            <input 
              type="text" 
              style={{ paddingLeft: '40px' }}
              placeholder="Minimum 3 characters"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={18} style={{ position: 'absolute', left: '12px', color: '#6366f1' }} />
            <input 
              type="password" 
              style={{ paddingLeft: '40px' }}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin m-auto" size={20} /> : 'Initialize Account'}
        </button>
      </form>

      <button className="link-btn" onClick={() => setView('login')}>
        Already have an account? Sign in
      </button>
    </motion.div>
  );
}

function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [otpToken, setOtpToken] = useState('');

  const init2FASetup = async () => {
    try {
      const res = await axios.get(`${API_BASE}/2fa/setup`);
      setQrCode(res.data.qrCode);
      setShow2FASetup(true);
    } catch (err) {
      toast.error('Failed to initiate 2FA setup');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await axios.post(`${API_BASE}/2fa/enable`, { token: otpToken });
      toast.success('2FA Enabled Successfully!');
      setShow2FASetup(false);
      // Refresh user profile
      const userRes = await axios.get(`${API_BASE}/profile`);
      setUser(userRes.data);
    } catch (err) {
      toast.error('Invalid token, try again');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ maxWidth: '600px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Terminal</h1>
        <button onClick={logout} style={{ width: 'auto', padding: '8px 16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Welcome, <span style={{ color: 'white', fontWeight: 600 }}>{user?.username}</span></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color={user?.is_two_factor_enabled ? '#22c55e' : '#f59e0b'} />
          <span>Security Status: {user?.is_two_factor_enabled ? 'Hardened (2FA Active)' : 'Vulnerable (2FA Disabled)'}</span>
        </div>
      </div>

      {!user?.is_two_factor_enabled && !show2FASetup && (
        <button onClick={init2FASetup} style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
          Enable 2FA Protection
        </button>
      )}

      {show2FASetup && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <h3>Multi-Factor Setup</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Scan this with Google Authenticator or Authy</p>
          <div className="qr-container">
            <img src={qrCode} alt="QR Code" style={{ width: '100%' }} />
          </div>
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              maxLength="6"
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
            />
          </div>
          <button onClick={handleVerify2FA}>Verify & Protect</button>
          <button className="link-btn" onClick={() => setShow2FASetup(false)}>Cancel</button>
        </div>
      )}

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Security Logs</p>
        <div style={{ fontSize: '0.8rem', color: '#22c55e', fontFamily: 'monospace', marginTop: '10px' }}>
          {' > '} Authenticated as {user?.username}<br />
          {' > '} Session initialized @ {new Date().toLocaleTimeString()}<br />
          {' > '} Layer 7 firewall active
        </div>
      </div>
    </motion.div>
  );
}

function TwoFactorVerify() {
  const { setUser, setView } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/2fa/verify`, { token });
      setUser(res.data);
      setView('dashboard');
      toast.success('Identity verified');
    } catch (err) {
      toast.error('Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
    >
      <ShieldCheck size={48} color="#6366f1" style={{ margin: '0 auto 1.5rem' }} />
      <h1>Verification</h1>
      <p className="subtitle">Enter the code from your authenticator app</p>
      
      <form onSubmit={handleVerify}>
        <div className="form-group">
          <input 
            type="text" 
            placeholder="000000" 
            maxLength="6"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin m-auto" size={20} /> : 'Verify Identity'}
        </button>
      </form>

      <button className="link-btn" onClick={() => setView('login')}>
        Return to login
      </button>
    </motion.div>
  );
}

export default App;
