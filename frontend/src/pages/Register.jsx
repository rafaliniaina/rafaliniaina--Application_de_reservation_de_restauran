import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'',
    password:'', confirm_password:'', phone:'', role:'client',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Prénom requis';
    if (!form.last_name.trim())  e.last_name  = 'Nom requis';
    if (!form.email.trim())      e.email      = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (!form.password)              e.password = 'Mot de passe requis';
    else if (form.password.length<8) e.password = 'Minimum 8 caractères';
    if (form.password !== form.confirm_password)
      e.confirm_password = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { first_name, last_name, email, password, phone, role } = form;
      const result = await register({ first_name, last_name, email, password, phone, role });
      toast.success('Compte créé avec succès !');
      if (result.user.role === 'owner') navigate('/owner',     { replace: true });
      else                              navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-sub">Rejoignez-nous et commencez à réserver.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prénom *</label>
              <input name="first_name" className={`form-input${errors.first_name?' error':''}`}
                placeholder="Jean" value={form.first_name} onChange={handleChange} />
              {errors.first_name && <span className="form-error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input name="last_name" className={`form-input${errors.last_name?' error':''}`}
                placeholder="Dupont" value={form.last_name} onChange={handleChange} />
              {errors.last_name && <span className="form-error">{errors.last_name}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input name="email" type="email" className={`form-input${errors.email?' error':''}`}
              placeholder="jean@example.com" value={form.email} onChange={handleChange} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input name="phone" type="tel" className="form-input"
              placeholder="+33 6 00 00 00 00" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe *</label>
            <input name="password" type="password"
              className={`form-input${errors.password?' error':''}`}
              placeholder="Minimum 8 caractères" value={form.password} onChange={handleChange} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe *</label>
            <input name="confirm_password" type="password"
              className={`form-input${errors.confirm_password?' error':''}`}
              placeholder="••••••••" value={form.confirm_password} onChange={handleChange} />
            {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Je suis *</label>
            <div className="role-selector">
              {[
                { value:'client', icon:'🍽', name:'Client',       desc:'Je veux réserver des tables' },
                { value:'owner',  icon:'🏪', name:'Propriétaire', desc:'Je gère un restaurant' },
              ].map(r => (
                <div key={r.value}
                  className={`role-option${form.role===r.value?' selected':''}`}
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}>
                  <div className="role-option-icon">{r.icon}</div>
                  <div className="role-option-name">{r.name}</div>
                  <div className="role-option-desc">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-blue btn-block" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-footer">
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color:'var(--blue)', fontWeight:700 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}