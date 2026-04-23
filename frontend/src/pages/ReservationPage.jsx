import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PRICE   = { 1:'€', 2:'€€', 3:'€€€' };
const TIMES   = ['12:00','12:30','13:00','13:30','19:00','19:30','20:00','20:30','21:00','21:30'];
const PARTIES = [1,2,3,4,5,6,7,8];

const today   = () => new Date().toISOString().split('T')[0];
const maxDate = () => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; };

export default function ReservationPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reservation_date: '',
    reservation_time: '',
    party_size: 2,
    special_requests: '',
  });

  useEffect(() => {
    api.get(`/restaurants/${id}`)
      .then(r => setRestaurant(r.data.data))
      .catch(() => { toast.error('Restaurant introuvable'); navigate('/restaurants'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.reservation_date) { toast.error('Choisissez une date'); return; }
    if (!form.reservation_time) { toast.error('Choisissez une heure'); return; }

    setSubmitting(true);
    try {
      const { data } = await api.post('/reservations', {
        ...form, restaurant_id: Number(id),
      });
      toast.success(`Réservation créée ! Code : ${data.data.confirmation_code}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!restaurant) return null;

  const availableTables = (restaurant.tables||[]).filter(t => t.is_available && t.capacity >= form.party_size);

  return (
    <div className="resv-form-page">
      <div className="container">
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:700, marginBottom:'.25rem' }}>
          Réserver chez {restaurant.name}
        </h1>
        <p style={{ color:'var(--gray-3)', fontSize:'.88rem', marginBottom:'1.5rem', fontWeight:500 }}>
          📍 {restaurant.address}, {restaurant.city} · {PRICE[restaurant.price_range]}
          {restaurant.avg_rating && ` · ★ ${parseFloat(restaurant.avg_rating).toFixed(1)}`}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="resv-layout">
            <div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input"
                  style={{ maxWidth:'200px' }}
                  min={today()} max={maxDate()}
                  value={form.reservation_date}
                  onChange={e => setForm(p => ({ ...p, reservation_date:e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Heure *</label>
                <div className="time-slots">
                  {TIMES.map(t => (
                    <button key={t} type="button"
                      className={`time-slot${form.reservation_time===t?' selected':''}`}
                      onClick={() => setForm(p => ({ ...p, reservation_time:t }))}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre de personnes *</label>
                <div className="party-btns">
                  {PARTIES.map(n => (
                    <button key={n} type="button"
                      className={`party-btn${form.party_size===n?' selected':''}`}
                      onClick={() => setForm(p => ({ ...p, party_size:n }))}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Capacité disponible</label>
                <div className="capacity-box">
                  <div className="capacity-label">Tables pour {form.party_size} personne(s)</div>
                  {availableTables.length === 0 ? (
                    <p style={{ fontSize:'.85rem', color:'#dc2626', fontWeight:600 }}>
                      Aucune table disponible pour ce nombre de personnes.
                    </p>
                  ) : (
                    <div className="tables-grid">
                      {(restaurant.tables||[]).map(t => {
                        const fits = t.capacity >= form.party_size;
                        return (
                          <div key={t.id}
                            className={`table-card${!t.is_available||!fits?' occupied':''}`}>
                            <div className="table-num">{t.table_number}</div>
                            <div className="table-cap">{t.capacity} pers.</div>
                            <div className={`table-status ${t.is_available && fits ? 'free' : 'occ'}`}>
                              {!t.is_available ? 'Occupée' : !fits ? 'Trop petite' : 'Disponible'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Demandes spéciales</label>
                <textarea className="form-input"
                  placeholder="Allergie, anniversaire, chaise haute..."
                  value={form.special_requests}
                  onChange={e => setForm(p => ({ ...p, special_requests:e.target.value }))} />
              </div>

              <button type="submit" className="btn btn-blue btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Réservation en cours...' : 'Confirmer la réservation'}
              </button>
            </div>

            <div>
              <div className="resv-summary">
                <div className="resv-summary-title">Récapitulatif</div>
                <div className="summary-row">
                  <span className="summary-key">Restaurant</span>
                  <span className="summary-val">{restaurant.name}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-key">Date</span>
                  <span className="summary-val">{form.reservation_date || '—'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-key">Heure</span>
                  <span className="summary-val" style={{ color:'var(--blue)' }}>
                    {form.reservation_time || '—'}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-key">Personnes</span>
                  <span className="summary-val">{form.party_size}</span>
                </div>
                {availableTables[0] && (
                  <div className="summary-row">
                    <span className="summary-key">Table assignée</span>
                    <span className="summary-val">
                      {availableTables[0].table_number} · {availableTables[0].capacity} pers.
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop:'1rem', background:'#fff', border:'1.5px solid var(--gold-border)', borderRadius:'var(--radius-lg)', padding:'1rem' }}>
                <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'.6rem' }}>
                  Contact restaurant
                </div>
                <div style={{ fontSize:'.85rem', color:'var(--gray-2)', lineHeight:1.8, fontWeight:500 }}>
                  📍 {restaurant.address}, {restaurant.city}
                  {restaurant.phone && <><br />📞 {restaurant.phone}</>}
                </div>
              </div>

              <div className="confirm-note">
                Annulation gratuite jusqu'à 2h avant votre réservation. Un email de confirmation vous sera envoyé automatiquement.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}