const slugify            = require('slugify');
const { pool }           = require('../config/db');
const { ok, fail, paginated } = require('../utils/apiResponse');

// GET /api/owner/restaurants
exports.getMyRestaurants = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*,
              COUNT(DISTINCT res.id) AS total_reservations
       FROM restaurants r
       LEFT JOIN reservations res ON res.restaurant_id = r.id
       WHERE r.owner_id=?
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return ok(res, rows);
  } catch (err) { next(err); }
};

// POST /api/owner/restaurants
exports.create = async (req, res, next) => {
  try {
    const { name, description, address, city, phone,
            email, cuisine_type, price_range } = req.body;

    if (!name || !address || !city)
      return fail(res, 'Nom, adresse et ville sont obligatoires.', 422);

    const slug       = slugify(name, { lower:true, strict:true }) + '-' + Date.now();
    const cover_image = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO restaurants
         (owner_id,name,slug,description,address,city,phone,email,
          cuisine_type,price_range,cover_image,approval_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [req.user.id, name, slug, description||null, address, city,
       phone||null, email||null, cuisine_type||null,
       price_range||2, cover_image]
    );

    const [[row]] = await pool.query(
      'SELECT * FROM restaurants WHERE id=?', [result.insertId]
    );
    return ok(res, row,
      'Restaurant soumis avec succès. En attente de validation.', 201);
  } catch (err) {
    console.error('ERREUR CREATE RESTAURANT:', err.message, err.code);
    next(err);
  }
};

// PUT /api/owner/restaurants/:id
exports.update = async (req, res, next) => {
  try {
    const [[rest]] = await pool.query(
      'SELECT * FROM restaurants WHERE id=? AND owner_id=?',
      [req.params.id, req.user.id]
    );
    if (!rest) return fail(res, 'Restaurant introuvable.', 404);

    const fields  = ['name','description','address','city','phone',
                     'email','cuisine_type','price_range'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.file) updates.cover_image = `/uploads/${req.file.filename}`;
    if (req.body.name) {
      updates.slug = slugify(req.body.name, { lower:true, strict:true }) + '-' + Date.now();
    }
    // Repasser en pending après modification
    updates.approval_status = 'pending';

    const keys   = Object.keys(updates);
    if (!keys.length) return fail(res, 'Aucun champ à mettre à jour.', 400);
    const set    = keys.map(k => `${k}=?`).join(', ');
    await pool.query(
      `UPDATE restaurants SET ${set} WHERE id=?`,
      [...Object.values(updates), req.params.id]
    );
    return ok(res, null, 'Restaurant mis à jour — resoumis pour validation.');
  } catch (err) { next(err); }
};

// DELETE /api/owner/restaurants/:id
exports.remove = async (req, res, next) => {
  try {
    const [[rest]] = await pool.query(
      'SELECT id FROM restaurants WHERE id=? AND owner_id=?',
      [req.params.id, req.user.id]
    );
    if (!rest) return fail(res, 'Restaurant introuvable.', 404);
    await pool.query(
      'UPDATE restaurants SET is_active=FALSE WHERE id=?', [req.params.id]
    );
    return ok(res, null, 'Restaurant supprimé.');
  } catch (err) { next(err); }
};

// GET /api/owner/reservations
exports.getReservations = async (req, res, next) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const offset = (Number(page)-1) * Number(limit);
    let where = 'WHERE rest.owner_id=?';
    const params = [req.user.id];
    if (status) { where += ' AND r.status=?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations r
       JOIN restaurants rest ON rest.id=r.restaurant_id ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT r.*, rest.name AS restaurant_name,
              u.first_name, u.last_name, u.email AS client_email, u.phone AS client_phone
       FROM reservations r
       JOIN restaurants rest ON rest.id=r.restaurant_id
       JOIN users u ON u.id=r.user_id
       ${where}
       ORDER BY r.reservation_date DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
};

// PUT /api/owner/reservations/:id/status
exports.updateResvStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['confirmed','cancelled','completed','no_show'];
    if (!valid.includes(status)) return fail(res, 'Statut invalide.', 400);

    const [[resv]] = await pool.query(
      `SELECT r.id FROM reservations r
       JOIN restaurants rest ON rest.id=r.restaurant_id
       WHERE r.id=? AND rest.owner_id=?`,
      [req.params.id, req.user.id]
    );
    if (!resv) return fail(res, 'Réservation introuvable.', 404);

    await pool.query('UPDATE reservations SET status=? WHERE id=?',
      [status, req.params.id]);
    return ok(res, null, `Statut mis à jour : ${status}`);
  } catch (err) { next(err); }
};

// GET /api/owner/stats
exports.getStats = async (req, res, next) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT
         COUNT(DISTINCT r.id)                                      AS total_restaurants,
         SUM(r.approval_status='approved')                         AS approved,
         SUM(r.approval_status='pending')                          AS pending,
         COUNT(DISTINCT res.id)                                    AS total_reservations,
         SUM(res.status='confirmed')                               AS confirmed,
         SUM(res.reservation_date=CURDATE())                       AS today
       FROM restaurants r
       LEFT JOIN reservations res ON res.restaurant_id=r.id
       WHERE r.owner_id=?`,
      [req.user.id]
    );
    return ok(res, stats);
  } catch (err) { next(err); }
};