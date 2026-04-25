import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const CUISINES = ['Française','Italienne','Japonaise','Mexicaine','Indienne','Chinoise','Américaine','Végétarienne'];
const STATUS_LABEL = { pending:'En attente', confirmed:'Confirmée', cancelled:'Annulée', completed:'Terminée', no_show:'Absent' };
const STATUS_CLASS = { pending:'badge-warning', confirmed:'badge-success', cancelled:'badge-gray', completed:'badge-blue', no_show:'badge-gray' };

function RestaurantForm({ restaurant, onClose, onSaved }) {
  const isEdit = !!restaurant?.id;
  const [form, setForm] = useState({
    name: restaurant?.name || '', description: restaurant?.description || '',
    address: restaurant?.address || '', city: restaurant?.city || '',
    phone: restaurant?.phone || '', email: restaurant?.email || '',
    cuisine_type: restaurant?.cuisine_type || '', price_range: restaurant?.price_range || 2,
  });
  const [image,  setImage]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Nom obligatoire';
    if (!form.address.trim()) e.address = 'Adresse obligatoire';
    if (!form.city.trim())    e.city    = 'Ville obligatoire';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (image) fd.append('cover_image', image);
      if (isEdit) await api.put(`/owner/restaurants/${restaurant.id}`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      else        await api.post('/owner/restaurants', fd, { headers:{'Content-Type':'multipart/form-data'} });
      toast.success(isEdit ? 'Restaurant mis à jour — resoumis pour validation.' : 'Restaurant soumis ! En attente de validation.');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem', overflowY:'auto' }}>
      <div style={{ background:'#fff', border:'2px solid var(--gold-border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.1rem 1.4rem', borderBottom:'1.5px solid var(--gold-border)', position:'sticky', top:0, background:'#fff' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700 }}>
            {isEdit ? 'Modifier le restaurant' : 'Ajouter un restaurant'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'var(--gray-3)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'1.4rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input name="name" className={`form-input${errors.name?' error':''}`}
                placeholder="Le Bistro Moderne" value={form.name} onChange={handleChange} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Cuisine</label>
              <select name="cuisine_type" className="form-input"
                value={form.cuisine_type} onChange={handleChange}>
                <option value="">Sélectionner...</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input"
              placeholder="Ambiance, spécialités..." value={form.description} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Adresse *</label>
              <input name="address" className={`form-input${errors.address?' error':''}`}
                placeholder="12 rue de la Paix" value={form.address} onChange={handleChange} />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Ville *</label>
              <input name="city" className={`form-input${errors.city?' error':''}`}
                placeholder="Paris" value={form.city} onChange={handleChange} />
              {errors.city && <span className="form-error">{errors.city}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input name="phone" className="form-input" placeholder="+33 1 00 00 00 00"
                value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" className="form-input"
                placeholder="contact@restaurant.fr" value={form.email} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Gamme de prix</label>
            <div className="price-options">
              {[[1,'€ Économique'],[2,'€€ Modéré'],[3,'€€€ Gastro']].map(([v,l]) => (
                <div key={v}
                  className={`price-option${form.price_range===v?' selected':''}`}
                  onClick={() => setForm(p => ({ ...p, price_range:v }))}>
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Photo du restaurant</label>
            <div className="upload-box" onClick={() => document.getElementById('img-upload').click()}>
              <div className="upload-box-icon">📷</div>
              <div className="upload-box-text">{image ? image.name : 'Cliquez pour ajouter une photo'}</div>
              <div className="upload-box-hint">JPEG, PNG ou WebP · Max 5 Mo</div>
            </div>
            <input id="img-upload" type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display:'none' }} onChange={e => setImage(e.target.files[0])} />
          </div>
          {!isEdit && (
            <div className="alert alert-info" style={{ fontSize:'.82rem' }}>
              ℹ Votre restaurant sera soumis à validation par l'administrateur avant d'être publié.
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'.6rem', marginTop:'.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-blue" disabled={saving}>
              {saving ? 'Envoi...' : (isEdit ? 'Mettre à jour' : 'Soumettre')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [tab,          setTab]          = useState('restaurants');
  const [restaurants,  setRestaurants]  = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [modal,        setModal]        = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'restaurants') {
        const r = await api.get('/owner/restaurants');
        setRestaurants(r.data.data);
      } else if (tab === 'reservations') {
        const r = await api.get('/owner/reservations');
        setReservations(r.data.data);
      } else if (tab === 'stats') {
        const r = await api.get('/owner/stats');
        setStats(r.data.data);
      }
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try {
      await api.delete(`/owner/restaurants/${id}`);
      toast.success('Restaurant supprimé');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleResvStatus = async (id, status) => {
    try {
      await api.put(`/owner/reservations/${id}/status`, { status });
      toast.success('Statut mis à jour');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const ApprovalBadge = ({ status }) => {
    const cfg = {
      approved:{ label:'✅ Approuvé',    cls:'badge-success' },
      pending: { label:'⏳ En attente',  cls:'badge-warning' },
      rejected:{ label:'❌ Refusé',      cls:'badge-danger'  },
    };
    const c = cfg[status] || cfg.pending;
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dash-header">
          <div className="dash-avatar" style={{ background:'var(--gold-bg)', color:'var(--gold)' }}>
            {user?.first_name[0]}{user?.last_name[0]}
          </div>
          <div>
            <div className="dash-title">Espace Propriétaire</div>
            <div className="dash-sub">{user?.first_name} {user?.last_name} — {user?.email}</div>
          </div>
        </div>

        <div className="dash-layout">
          <div className="dash-sidebar">
            {[
              { key:'restaurants',  icon:'🏪', label:'Mes restaurants' },
              { key:'reservations', icon:'📅', label:'Réservations' },
              { key:'stats',        icon:'📊', label:'Statistiques' },
            ].map(n => (
              <button key={n.key}
                className={`dash-nav-item${tab===n.key?' active':''}`}
                onClick={() => setTab(n.key)}>
                <span>{n.icon}</span> {n.label}
              </button>
            ))}
          </div>

          <div className="dash-content">
            {loading && <div className="loading-center"><div className="spinner" /></div>}

            {tab === 'restaurants' && !loading && (
              <>
                <div className="section-header">
                  <div>
                    <div className="section-title-sm">Mes restaurants</div>
                    <p style={{ fontSize:'.8rem', color:'var(--gray-3)', marginTop:'.15rem' }}>
                      Les restaurants approuvés sont visibles aux clients
                    </p>
                  </div>
                  <button className="btn btn-blue btn-sm" onClick={() => setModal({})}>
                    + Ajouter un restaurant
                  </button>
                </div>

                {restaurants.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏪</div>
                    <div className="empty-title">Aucun restaurant</div>
                    <div className="empty-text">Ajoutez votre premier restaurant.</div>
                    <button className="btn btn-blue btn-sm" style={{ marginTop:'1rem' }}
                      onClick={() => setModal({})}>
                      + Ajouter un restaurant
                    </button>
                  </div>
                ) : restaurants.map(r => (
                  <div key={r.id} className="owner-rest-card">
                    {r.cover_image
                      ? <img src={r.cover_image.startsWith('http') ? r.cover_image : r.cover_image}
                          alt={r.name} className="owner-rest-img"
                          onError={e => e.target.style.display='none'} />
                      : <div className="owner-rest-img-placeholder">🍽</div>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.25rem' }}>
                        <div className="owner-rest-name">{r.name}</div>
                        <ApprovalBadge status={r.approval_status} />
                      </div>
                      <div className="owner-rest-info">📍 {r.address}, {r.city}{r.cuisine_type && ` · ${r.cuisine_type}`}</div>
                      {r.approval_status === 'pending' && (
                        <div className="alert alert-warning" style={{ fontSize:'.78rem', padding:'.4rem .7rem', marginTop:'.4rem', marginBottom:'.4rem' }}>
                          ⏳ En attente de validation par l'administrateur
                        </div>
                      )}
                      {r.approval_status === 'rejected' && r.rejection_reason && (
                        <div className="alert alert-danger" style={{ fontSize:'.78rem', padding:'.4rem .7rem', marginTop:'.4rem', marginBottom:'.4rem' }}>
                          Motif du refus : {r.rejection_reason}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:'.4rem', marginTop:'.5rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setModal(r)}>✏ Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, r.name)}>Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'reservations' && !loading && (
              <>
                <div className="section-title-sm" style={{ marginBottom:'1rem' }}>Réservations reçues</div>
                {reservations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <div className="empty-title">Aucune réservation</div>
                    <div className="empty-text">Les réservations de vos clients apparaîtront ici.</div>
                  </div>
                ) : (
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Code</th><th>Restaurant</th><th>Client</th>
                          <th>Date</th><th>Pers.</th><th>Statut</th><th>Action</th>
                        </tr>
                      </thead>
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
                              <select className="form-input" style={{ padding:'.25rem .5rem', fontSize:'.8rem', width:'auto', minWidth:'120px' }}
                                value={r.status}
                                onChange={e => handleResvStatus(r.id, e.target.value)}>
                                <option value="pending">En attente</option>
                                <option value="confirmed">Confirmer</option>
                                <option value="cancelled">Annuler</option>
                                <option value="completed">Terminée</option>
                                <option value="no_show">Absent</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'stats' && !loading && stats && (
              <>
                <div className="section-title-sm" style={{ marginBottom:'1rem' }}>Statistiques</div>
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-label">Restaurants</div><div className="stat-value">{stats.total_restaurants||0}</div></div>
                  <div className="stat-card"><div className="stat-label">Approuvés</div><div className="stat-value" style={{ color:'#16a34a' }}>{stats.approved||0}</div></div>
                  <div className="stat-card"><div className="stat-label">Réservations</div><div className="stat-value">{stats.total_reservations||0}</div></div>
                  <div className="stat-card"><div className="stat-label">Aujourd'hui</div><div className="stat-value" style={{ color:'var(--blue)' }}>{stats.today||0}</div></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {modal !== null && (
        <RestaurantForm restaurant={modal} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}
