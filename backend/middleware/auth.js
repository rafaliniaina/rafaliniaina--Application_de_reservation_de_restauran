const jwt          = require('jsonwebtoken');
const { pool }     = require('../config/db');
const { fail }     = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return fail(res, 'Non autorisé — token manquant', 401);

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [[user]] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active,
              r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.is_active = TRUE`,
      [decoded.id]
    );

    if (!user) return fail(res, 'Utilisateur introuvable', 401);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return fail(res, 'Session expirée — reconnectez-vous', 401);
    return fail(res, 'Token invalide', 401);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return fail(res, 'Accès refusé — droits admin requis', 403);
};

const isOwner = (req, res, next) => {
  if (req.user?.role === 'owner' || req.user?.role === 'admin') return next();
  return fail(res, 'Accès refusé — droits propriétaire requis', 403);
};

module.exports = { protect, isAdmin, isOwner };