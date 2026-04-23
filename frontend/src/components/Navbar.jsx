import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Vous êtes déconnecté');
    navigate('/');
  };

  const dashLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'owner') return '/owner';
    return '/dashboard';
  };

  const dashLabel = () => {
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'owner') return 'Mon espace';
    return 'Mes réservations';
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">🍽 RestaurantApp</Link>
        <div className="navbar-links">
          <NavLink to="/restaurants" className={({isActive}) =>
            'navbar-link' + (isActive ? ' active' : '')}>
            Restaurants
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to={dashLink()} className={({isActive}) =>
                'navbar-link' + (isActive ? ' active' : '')}>
                {dashLabel()}
              </NavLink>
              <div
                className="navbar-avatar"
                title={`${user.first_name} ${user.last_name}`}
                onClick={() => navigate(dashLink())}
              >
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-outline btn-sm">Connexion</Link>
              <Link to="/register" className="btn btn-blue   btn-sm">Créer un compte</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}