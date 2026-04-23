import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || null;

  const [form,    setForm]    = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = 'Email requis';
    if (!form.password) errs.password = 'Mot de passe requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      toast.success(`Bienvenue, ${result.user.first_name} !`);
      if (from) { navigate(from, { replace: true }); return; }
      if (result.user.role === 'admin') navigate('/admin',     { replace: true });
      else if (result.user.role === 'owner') navigate('/owner', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Connexion</h1>
        <p className="auth-sub">Bienvenue ! Connectez-vous à votre compte.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input name="email" type="email" className={`form-input${errors.email?' error':''}`}
              placeholder="votre@email.com" value={form.email} onChange={handleChange}
              autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe *</label>
            <input name="password" type="password" className={`form-input${errors.password?' error':''}`}
              placeholder="••••••••" value={form.password} onChange={handleChange}
              autoComplete="current-password" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-blue btn-block" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-footer">
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color:'var(--blue)', fontWeight:700 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}