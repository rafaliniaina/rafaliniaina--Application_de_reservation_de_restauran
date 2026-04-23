import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const STATUS_LABEL = { pending:'En attente', confirmed:'Confirmée', cancelled:'Annulée', completed:'Terminée', no_show:'Absent' };
const STATUS_CLASS = { pending:'badge-warning', confirmed:'badge-success', cancelled:'badge-gray', completed:'badge-blue', no_show:'badge-gray' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab,          setTab]          = useState('stats');
  const [stats,        setStats]        = useState(null);
  const [restaurants,  setRestaurants]  = useState([]);
  const [reservations, setReservations] = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [resvFilter,   setResvFilter]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const r = await api.get('/admin/stats');
        setStats(r.data.data);
      } else if (tab === 'restaurants') {
        const params = {};
        if (statusFilter) params.approval_status = statusFilter;
        const r = await api.get('/admin/restaurants', { params });
        setRestaurants(r.data.data);
      } else if (tab === 'reservations') {
        const params = {};
        if (resvFilter) params.status = resvFilter;
        const r = await api.get('/admin/reservations', { params });
        setReservations(r.data.data);
      } else if (tab === 'users') {
        const r = await api.get('/admin/users');
        setUsers(r.data.data);
      }
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, [tab, statusFilter, resvFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, name) => {
    if (!window.confirm(`Approuver "${name}" ?`)) return;
    try {
      await api.put(`/admin/restaurants/${id}/approve`);
      toast.success(`✅ "${name}" approuvé — visible dans la liste.`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleReject = async (id, name) => {
    const reason = window.prompt(`Motif du refus pour "${name}" (optionnel) :`);
    if (reason === null) return;
    try {
      await api.put(`/admin/restaurants/${id}/reject`, { reason });
      toast.error(`❌ "${name}" refusé.`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDeleteRestaurant = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement "${name}" ?`)) return;
    try {
      await api.delete(`/admin/restaurants/${id}`);
      toast.success('Restaurant supprimé');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Désactiver le compte de "${name}" ?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Utilisateur désactivé');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const pendingRestaurants = restaurants.filter(r => r.approval_status === 'pending');

  const TABS = [
    { key:'stats',        icon:'📊', label:'Statistiques' },
    { key:'restaurants',  icon:'🍽', label:'Restaurants', badge: pendingRestaurants.length },
    { key:'reservations', icon:'📅', label:'Réservations' },
    { key:'users',        icon:'👥', label:'Utilisateurs' },
  ];

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dash-header">
          <div className="dash-avatar" style={{ background:'#ede9fe', color:'#5b21b6', borderColor:'#c4b5fd' }}>
            {user?.first_name[0]}{user?.last_name[0]}
          </div>
          <div>
            <div className="dash-title">Dashboard Administrateur</div>
            <div className="dash-sub">{user?.email}</div>
          </div>
        </div>

        <div className="dash-layout">
          <div className="dash-sidebar">
            {TABS.map(n => (
              <button key={n.key}
                className={`dash-nav-item${tab===n.key?' active':''}`}
                onClick={() => setTab(n.key)}>
                <span>{n.icon}</span> {n.label}
                {n.badge > 0 && <span className="dash-nav-badge">{n.badge}</span>}
              </button>
            ))}
          </div>

          <div className="dash-content">
            {loading && <div className="loading-center"><div className="spinner" /></div>}

            {tab === 'stats' && !loading && stats && (
              <>
                <div className="section-title-sm" style={{ marginBottom:'1rem' }}>Statistiques générales</div>
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-label">Utilisateurs</div><div className="stat-value" style={{ color:'var(--blue)' }}>{stats.totals.total_users}</div></div>
                  <div className="stat-card"><div className="stat-label">Approuvés</div><div className="stat-value" style={{ color:'#16a34a' }}>{stats.totals.approved}</div></div>
                  <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-value" style={{ color:'#d97706' }}>{stats.totals.pending}</div></div>
                  <div className="stat-card"><div className="stat-label">Réservations</div><div className="stat-value">{stats.totals.total_reservations}</div></div>
                  <div className="stat-card"><div className="stat-label">Aujourd'hui</div><div className="stat-value" style={{ color:'var(--blue)' }}>{stats.totals.today}</div></div>
                </div>
                {stats.topRestaurants?.length > 0 && (
                  <>
                    <div className="section-title-sm" style={{ margin:'1.25rem 0 .75rem' }}>Top restaurants</div>
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead><tr><th>Restaurant</th><th>Ville</th><th>Réservations</th></tr></thead>
                        <tbody>
                          {stats.topRestaurants.map((r,i) => (
                            <tr key={i}>
                              <td><strong>{r.name}</strong></td>
                              <td>{r.city}</td>
                              <td><span style={{ fontWeight:700, color:'var(--gold)' }}>{r.total}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'restaurants' && !loading && (
              <>
                {pendingRestaurants.length > 0 && (
                  <>
                    <div className="section-header" style={{ marginBottom:'.75rem' }}>
                      <div className="section-title-sm">En attente de validation</div>
                      <span className="badge badge-warning">{pendingRestaurants.length} en attente</span>
                    </div>
                    {pendingRestaurants.map(r => (
                      <div key={r.id} className="pending-card">
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                          <div>
                            <div className="pending-name">{r.name}</div>
                            <div className="pending-info">
                              📍 {r.address}, {r.city}
                              {r.cuisine_type && ` · ${r.cuisine_type}`}
                              {r.owner_email && ` · 👤 ${r.owner_first} ${r.owner_last} (${r.owner_email})`}
                            </div>
                            {r.description && (
                              <p style={{ fontSize:'.8rem', color:'var(--gray-3)', marginTop:'.35rem', lineHeight:1.5 }}>
                                {r.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display:'flex', gap:'.4rem', flexShrink:0 }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id, r.name)}>✅ Approuver</button>
                            <button className="btn btn-danger  btn-sm" onClick={() => handleReject(r.id, r.name)}>❌ Refuser</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop:'2px solid var(--gold-border)', margin:'1.25rem 0' }} />
                  </>
                )}

                <div className="section-header">
                  <div className="section-title-sm">Tous les restaurants</div>
                  <div style={{ display:'flex', gap:'.4rem' }}>
                    {[['','Tous'],['approved','Approuvés'],['pending','En attente'],['rejected','Refusés']].map(([v,l]) => (
                      <button key={v}
                        className={`btn btn-sm ${statusFilter===v?'btn-blue':'btn-outline'}`}
                        onClick={() => setStatusFilter(v)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Nom</th><th>Ville</th><th>Propriétaire</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                      {restaurants.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.name}</strong></td>
                          <td>{r.city}</td>
                          <td style={{ fontSize:'.8rem' }}>
                            {r.owner_first ? `${r.owner_first} ${r.owner_last}` : '—'}
                          </td>
                          <td>
                            {r.approval_status === 'approved' && <span className="badge badge-success">✅ Approuvé</span>}
                            {r.approval_status === 'pending'  && <span className="badge badge-warning">⏳ En attente</span>}
                            {r.approval_status === 'rejected' && <span className="badge badge-danger">❌ Refusé</span>}
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:'.3rem' }}>
                              {r.approval_status === 'pending' && <>
                                <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id, r.name)}>✅</button>
                                <button className="btn btn-danger  btn-sm" onClick={() => handleReject(r.id, r.name)}>❌</button>
                              </>}
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRestaurant(r.id, r.name)}>Suppr.</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {restaurants.length === 0 && (
                    <p style={{ textAlign:'center', padding:'2rem', color:'var(--gray-3)', fontSize:'.88rem' }}>
                      Aucun restaurant.
                    </p>
                  )}
                </div>
              </>
            )}

            {tab === 'reservations' && !loading && (
              <>
                <div className="section-header">
                  <div className="section-title-sm">Toutes les réservations</div>
                  <select className="form-input" style={{ width:'auto', padding:'.3rem .7rem', fontSize:'.85rem' }}
                    value={resvFilter} onChange={e => setResvFilter(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    {Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Code</th><th>Restaurant</th><th>Client</th><th>Date</th><th>Pers.</th><th>Statut</th><th>Action</th></tr></thead>
                    <tbody>
                      {reservations.map(r => (
                        <tr key={r.id}>
                          <td><span className="resv-code">{r.confirmation_code}</span></td>
                          <td><strong>{r.restaurant_name}</strong></td>
                          <td>{r.first_name} {r.last_name}</td>
                          <td>{r.reservation_date} · {String(r.reservation_time).slice(0,5)}</td>
                          <td>{r.party_size}</td>
                          <td><span className={`badge ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                          <td>
                            <select className="form-input" style={{ padding:'.25rem .5rem', fontSize:'.8rem', width:'auto' }}
                              value={r.status}
                              onChange={async e => {
                                try {
                                  await api.put(`/admin/reservations/${r.id}/status`, { status: e.target.value });
                                  toast.success('Statut mis à jour');
                                  load();
                                } catch { toast.error('Erreur'); }
                              }}>
                              {Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reservations.length === 0 && (
                    <p style={{ textAlign:'center', padding:'2rem', color:'var(--gray-3)', fontSize:'.88rem' }}>
                      Aucune réservation.
                    </p>
                  )}
                </div>
              </>
            )}

            {tab === 'users' && !loading && (
              <>
                <div className="section-title-sm" style={{ marginBottom:'1rem' }}>
                  Utilisateurs ({users.length})
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Réservations</th><th>Inscrit le</th><th>Action</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.first_name} {u.last_name}</strong></td>
                          <td style={{ fontSize:'.82rem' }}>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role==='admin'?'badge-blue':u.role==='owner'?'badge-gold':'badge-gray'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>{u.total_reservations}</td>
                          <td style={{ fontSize:'.8rem' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                          <td>
                            {u.role !== 'admin' && (
                              <button className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`)}>
                                Désactiver
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}