const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const { pool }     = require('../config/db');
const { ok, fail } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, role } = req.body;

    if (!first_name || !last_name || !email || !password)
      return fail(res, 'Tous les champs obligatoires doivent être remplis.', 422);

    if (password.length < 8)
      return fail(res, 'Le mot de passe doit faire au moins 8 caractères.', 422);

    // Vérifier email unique
    const [[existing]] = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]
    );
    if (existing) return fail(res, 'Cet email est déjà utilisé.', 409);

    // Déterminer role_id : 1=client, 2=owner (jamais admin via inscription)
    const role_id = role === 'owner' ? 2 : 1;

    const hash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name.trim(), last_name.trim(), email.toLowerCase().trim(),
       hash, phone || null, role_id]
    );

    const [[newUser]] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      [result.insertId]
    );

    return ok(res, { user: newUser, token: makeToken(newUser) },
      'Compte créé avec succès', 201);
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return fail(res, 'Email et mot de passe requis.', 422);

    const [[user]] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email,
              u.password_hash, u.is_active, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    const ERR = 'Email ou mot de passe incorrect.';
    if (!user) return fail(res, ERR, 401);
    if (!user.is_active) return fail(res, 'Compte désactivé.', 403);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return fail(res, ERR, 401);

    const { password_hash, is_active, ...safeUser } = user;
    return ok(res, { user: safeUser, token: makeToken(safeUser) }, 'Connexion réussie');
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
              r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    return ok(res, user);
  } catch (err) { next(err); }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    await pool.query(
      'UPDATE users SET first_name=?, last_name=?, phone=? WHERE id=?',
      [first_name, last_name, phone || null, req.user.id]
    );
    return ok(res, null, 'Profil mis à jour');
  } catch (err) { next(err); }
};