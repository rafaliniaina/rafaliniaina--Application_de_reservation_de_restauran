import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const STATUS_LABEL = {
  pending:'En attente', confirmed:'Confirmée',
  cancelled:'Annulée', completed:'Terminée', no_show:'Absent'
};
const STATUS_CLASS = {
  pending:'badge-warning', confirmed:'badge-success',
  cancelled:'badge-gray', completed:'badge-blue', no_show:'badge-gray'
};

export default function ClientDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab,          setTab]          = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
  });
  const [saving, setSaving] = useState(false);

  const loadReservations = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/reservations/mine', { params })
      .then(r => setReservations(r.data.data))
      .catch(() => toast.error('Erreur chargement réservations'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { if (tab === 'reservations') loadReservations(); }, [tab, loadReservations]);

  const handleCancel = async id => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Réservation annulée');
      loadReservations();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', profile);
      updateUser({ ...user, ...profile });
      toast.success('Profil mis à jour');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dash-header">
          <div className="dash-avatar">{user?.first_name[0]}{user?.last_name[0]}</div>
          <div>
            <div className="dash-title">Bonjour, {user?.first_name} !</div>
            <div className="dash-sub">{user?.email}</div>
          </div>
        </div>

        <div className="dash-layout">
          <div className="dash-sidebar">
            {[
              { key:'reservations', icon:'📅', label:'Réservations' },
              { key:'profile',      icon:'👤', label:'Mon profil' },
            ].map(n => (
              <button key={n.key}
                className={`dash-nav-item${tab===n.key?' active':''}`}
                onClick={() => setTab(n.key)}>
                <span>{n.icon}</span> {n.label}
              </button>
            ))}
          </div>

          <div className="dash-content">
            {tab === 'reservations' && (
              <>
                <div className="section-header">
                  <div className="section-title-sm">Mes réservations</div>
                  <button className="btn btn-blue btn-sm"
                    onClick={() => navigate('/restaurants')}>
                    + Nouvelle réservation
                  </button>
                </div>

                <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', marginBottom:'1rem' }}>
                  {[['','Toutes'],['pending','En attente'],['confirmed','Confirmées'],
                    ['cancelled','Annulées'],['completed','Terminées']].map(([val,label]) => (
                    <button key={val}
                      className={`btn btn-sm ${statusFilter===val?'btn-blue':'btn-outline'}`}
                      onClick={() => setStatusFilter(val)}>
                      {label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="loading-center"><div className="spinner" /></div>
                ) : reservations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <div className="empty-title">Aucune réservation</div>
                    <div className="empty-text">Vous n'avez pas encore de réservation.</div>
                    <button className="btn btn-blue btn-sm" style={{ marginTop:'1rem' }}
                      onClick={() => navigate('/restaurants')}>
                      Trouver un restaurant
                    </button>
                  </div>
                ) : reservations.map(r => (
                  <div key={r.id} className="resv-item">
                    <div>
                      <div className="resv-name">{r.restaurant_name}</div>
                      <div className="resv-detail">
                        📅 {r.reservation_date} · {String(r.reservation_time).slice(0,5)} · {r.party_size} pers.
                      </div>
                      <div className="resv-code">{r.confirmation_code}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.4rem' }}>
                      <span className={`badge ${STATUS_CLASS[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      {['pending','confirmed'].includes(r.status) && (
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(r.id)}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'profile' && (
              <div style={{ maxWidth:'460px' }}>
                <div className="section-title-sm" style={{ marginBottom:'1rem' }}>Mon profil</div>
                <form onSubmit={handleProfileSave} className="card">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Prénom</label>
                      <input className="form-input" value={profile.first_name}
                        onChange={e => setProfile(p => ({ ...p, first_name:e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nom</label>
                      <input className="form-input" value={profile.last_name}
                        onChange={e => setProfile(p => ({ ...p, last_name:e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={user?.email} disabled
                      style={{ opacity:.6, cursor:'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Téléphone</label>
                    <input className="form-input" value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone:e.target.value }))} />
                  </div>
                  <button type="submit" className="btn btn-blue" disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}