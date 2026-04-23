import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const PRICE = { 1:'€', 2:'€€', 3:'€€€' };

export default function RestaurantDetail() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('info');

  useEffect(() => {
    api.get(`/restaurants/${id}`)
      .then(r => setRestaurant(r.data.data))
      .catch(() => { toast.error('Restaurant introuvable'); navigate('/restaurants'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!restaurant) return null;

  const { name, city, cuisine_type, price_range, cover_image,
          description, avg_rating, review_count, tables=[], reviews=[] } = restaurant;

  return (
    <div>
      <div className="detail-hero"
        style={{ backgroundImage: cover_image ? `url(${cover_image})` : 'none',
                 background: !cover_image ? 'var(--gold-bg)' : undefined }}>
        <div className="detail-hero-overlay">
          <div className="container">
            <button className="btn btn-outline btn-sm" style={{ marginBottom:'.75rem', background:'rgba(255,255,255,.15)', color:'#fff', borderColor:'rgba(255,255,255,.4)' }}
              onClick={() => navigate('/restaurants')}>
              ← Retour
            </button>
            <h1 className="detail-hero-title">{name}</h1>
            <div className="detail-hero-meta">
              {cuisine_type && <span className="badge badge-gold">{cuisine_type}</span>}
              <span className="badge badge-gold">{PRICE[price_range]||'€€'}</span>
              {avg_rating && (
                <span className="badge badge-gold">
                  ★ {parseFloat(avg_rating).toFixed(1)} · {review_count} avis
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {[
          { key:'info',  label:'Informations' },
          { key:'avis',  label:`Avis (${review_count||0})` },
          { key:'reserver', label:'📅 Réserver' },
        ].map(t => (
          <button key={t.key}
            className={`detail-tab${tab===t.key?' active':''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="container detail-content">
        {tab === 'info' && (
          <div className="detail-2col">
            <div>
              <div className="info-card" style={{ marginBottom:'1rem' }}>
                <div className="info-card-title">À propos</div>
                <p className="info-text">{description || 'Aucune description disponible.'}</p>
              </div>
              <div className="info-card">
                <div className="info-card-title">Contact</div>
                <div className="info-text">
                  📍 {restaurant.address}, {city}<br />
                  {restaurant.phone && <>📞 {restaurant.phone}<br /></>}
                  {restaurant.email && <>✉ {restaurant.email}</>}
                </div>
              </div>
            </div>
            <div>
              <div className="info-card" style={{ marginBottom:'1rem' }}>
                <div className="info-card-title">Tables disponibles</div>
                {tables.length === 0
                  ? <p className="info-text">Aucune table renseignée.</p>
                  : <div className="tables-grid">
                      {tables.map(t => (
                        <div key={t.id}
                          className={`table-card${!t.is_available?' occupied':''}`}>
                          <div className="table-num">{t.table_number}</div>
                          <div className="table-cap">{t.capacity} pers.</div>
                          <div className={`table-status ${t.is_available?'free':'occ'}`}>
                            {t.is_available ? 'Disponible' : 'Occupée'}
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
              {isAuthenticated ? (
                <button className="btn btn-blue btn-block"
                  onClick={() => navigate(`/reservation/${id}`)}>
                  📅 Réserver maintenant
                </button>
              ) : (
                <div className="alert alert-info">
                  🔒 <Link to="/login" style={{ color:'var(--blue)', fontWeight:700 }}>Connectez-vous</Link> pour réserver une table.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'avis' && (
          <div style={{ maxWidth:'640px' }}>
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <div className="empty-title">Aucun avis pour l'instant</div>
                <div className="empty-text">Soyez le premier à donner votre avis.</div>
              </div>
            ) : reviews.map((r, i) => (
              <div key={i} className="review-item">
                <div className="review-avatar">
                  {r.first_name[0]}{r.last_name[0]}
                </div>
                <div>
                  <div className="review-name">
                    {r.first_name} {r.last_name[0]}.{' '}
                    <span className="review-stars">{'★'.repeat(r.rating)}</span>
                  </div>
                  {r.comment && <p className="review-text">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reserver' && (
          <div style={{ maxWidth:'480px' }}>
            {isAuthenticated ? (
              <button className="btn btn-blue btn-lg btn-block"
                onClick={() => navigate(`/reservation/${id}`)}>
                📅 Aller au formulaire de réservation
              </button>
            ) : (
              <div className="alert alert-info">
                🔒 Vous devez être connecté pour réserver.{' '}
                <Link to="/login" style={{ color:'var(--blue)', fontWeight:700 }}>Se connecter</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}