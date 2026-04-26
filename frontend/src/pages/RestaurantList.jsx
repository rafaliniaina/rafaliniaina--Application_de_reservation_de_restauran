import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const PRICE = { 1:'€', 2:'€€', 3:'€€€' };

function RestaurantCard({ r, isAuthenticated }) {
  const navigate = useNavigate();
  const imgSrc = r.cover_image || null;

  return (
    <div className="rest-card">
      {imgSrc
        ? <img src={imgSrc} alt={r.name} className="rest-card-img"
            onError={e => { e.target.style.display='none'; }} />
        : <div className="rest-card-img-placeholder">🍽</div>
      }
      <div className="rest-card-body">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.25rem' }}>
          <div className="rest-card-name">{r.name}</div>
          <span className="badge badge-gold">{PRICE[r.price_range] || '€€'}</span>
        </div>
        {r.cuisine_type && (
          <span className="badge badge-blue" style={{ marginBottom:'.4rem', display:'inline-block' }}>
            {r.cuisine_type}
          </span>
        )}
        <div className="rest-card-loc">📍 {r.city}</div>
        <div className="rest-card-footer">
          <div>
            <div className="rest-card-stars">
              {'★'.repeat(Math.round(r.avg_rating||0))}{'☆'.repeat(5-Math.round(r.avg_rating||0))}
            </div>
            <div className="rest-card-count">{r.review_count||0} avis</div>
          </div>
          {isAuthenticated
            ? <button className="btn btn-blue btn-sm"
                onClick={() => navigate(`/restaurants/${r.id}`)}>
                Réserver
              </button>
            : <button className="btn btn-outline btn-sm"
                onClick={() => navigate(`/restaurants/${r.id}`)}>
                Voir →
              </button>
          }
        </div>
      </div>
    </div>
  );
}

export default function RestaurantList() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [filters, setFilters] = useState({
    search:  searchParams.get('search') || '',
    city:    searchParams.get('city')   || '',
    cuisine: searchParams.get('cuisine')|| '',
    price:   searchParams.get('price')  || '',
    page:    Number(searchParams.get('page')) || 1,
  });

  useEffect(() => {
  const fetchRestaurants = async () => {
    setLoading(true);

    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });

      const r = await api.get("/restaurants", { params });
      setRestaurants(r.data.data);
      setPagination(r.data.pagination);

      const sp = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) sp[k] = String(v);
      });
      setSearchParams(sp, { replace: true });

    } catch (err) {
      toast.error("Erreur lors du chargement des restaurants");
    } finally {
      setLoading(false);
    }
  };

  fetchRestaurants();
}, [filters, setSearchParams]);
  const handleSearch = e => {
    e.preventDefault();
    setFilters(p => ({ ...p, page:1 }));
  };

  const reset = () => setFilters({ search:'', city:'', cuisine:'', price:'', page:1 });

  return (
    <div style={{ padding:'2rem 0 4rem' }}>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Nos restaurants</h1>
          <p className="page-sub">{pagination ? `${pagination.total} restaurant(s) trouvé(s)` : ''}</p>
        </div>

        <form className="filters-card" onSubmit={handleSearch}>
          <div className="filters-grid">
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Rechercher</label>
              <input className="form-input" placeholder="Nom, cuisine..."
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search:e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Ville</label>
              <input className="form-input" placeholder="Paris, Lyon..."
                value={filters.city}
                onChange={e => setFilters(p => ({ ...p, city:e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Cuisine</label>
              <select className="form-input"
                value={filters.cuisine}
                onChange={e => setFilters(p => ({ ...p, cuisine:e.target.value }))}>
                <option value="">Toutes les cuisines</option>
                {['Française','Italienne','Japonaise','Mexicaine','Indienne',
                  'Chinoise','Américaine','Végétarienne','Méditerranéenne'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label">Budget</label>
              <select className="form-input"
                value={filters.price}
                onChange={e => setFilters(p => ({ ...p, price:e.target.value }))}>
                <option value="">Tous les prix</option>
                <option value="1">€ — Économique</option>
                <option value="2">€€ — Modéré</option>
                <option value="3">€€€ — Gastronomique</option>
              </select>
            </div>
          </div>
          <div className="filters-actions">
            <button type="submit" className="btn btn-blue btn-sm">Rechercher</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={reset}>Réinitialiser</button>
          </div>
        </form>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : restaurants.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🍽</div>
            <p style={{ fontWeight:600, color:'var(--gray-2)', marginBottom:'.5rem' }}>Aucun restaurant trouvé</p>
            <p style={{ fontSize:'.88rem', color:'var(--gray-3)' }}>Essayez de modifier vos critères de recherche.</p>
            <button className="btn btn-gold btn-sm" style={{ marginTop:'1rem' }} onClick={reset}>
              Voir tous les restaurants
            </button>
          </div>
        ) : (
          <div className="restaurants-grid">
            {restaurants.map(r => (
              <RestaurantCard key={r.id} r={r} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        )}

        {!isAuthenticated && restaurants.length > 0 && (
          <div className="locked-banner">
            🔒 Connectez-vous pour effectuer une réservation.{' '}
            <Link to="/login" style={{ color:'var(--blue)', fontWeight:700 }}>Se connecter</Link>
            {' '}ou{' '}
            <Link to="/register" style={{ color:'var(--blue)', fontWeight:700 }}>Créer un compte</Link>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={!pagination.hasPrev}
              onClick={() => setFilters(p => ({ ...p, page:p.page-1 }))}>←</button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i+1).map(n => (
              <button key={n}
                className={`page-btn${filters.page===n?' active':''}`}
                onClick={() => setFilters(p => ({ ...p, page:n }))}>
                {n}
              </button>
            ))}
            <button className="page-btn" disabled={!pagination.hasNext}
              onClick={() => setFilters(p => ({ ...p, page:p.page+1 }))}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}
