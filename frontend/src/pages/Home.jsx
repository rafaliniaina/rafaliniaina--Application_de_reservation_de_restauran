import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = e => {
    e.preventDefault();
    navigate(`/restaurants${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero-tag">Réservation en ligne</div>
          <h1 className="hero-title">
            Trouvez et réservez<br />
            <span>votre table idéale</span>
          </h1>
          <p className="hero-sub">
            Des centaines de restaurants à portée de clic.<br />
            Réservez en quelques secondes, sans attente.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              className="hero-search-input"
              placeholder="Restaurant, cuisine, ville..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-blue btn-lg">
              Rechercher
            </button>
          </form>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">200+</div>
              <div className="hero-stat-label">Restaurants</div>
            </div>
            <div>
              <div className="hero-stat-value">5 000+</div>
              <div className="hero-stat-label">Réservations</div>
            </div>
            <div>
              <div className="hero-stat-value">4.8★</div>
              <div className="hero-stat-label">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            {[
              { icon:'🔍', title:'Recherche facile',       desc:'Filtrez par cuisine, prix et ville en un clic.' },
              { icon:'📅', title:'Réservation rapide',     desc:'Réservez votre table en moins de 30 secondes.' },
              { icon:'✅', title:'Confirmation immédiate', desc:'Code de confirmation instantané par email.' },
              { icon:'🔔', title:'Rappels automatiques',   desc:'Ne manquez plus jamais votre réservation.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Prêt à réserver ?</h2>
          <p className="cta-sub">Découvrez nos restaurants partenaires dès maintenant.</p>
          <button className="btn btn-gold btn-lg"
            onClick={() => navigate('/restaurants')}>
            Voir tous les restaurants
          </button>
        </div>
      </section>
    </main>
  );
}