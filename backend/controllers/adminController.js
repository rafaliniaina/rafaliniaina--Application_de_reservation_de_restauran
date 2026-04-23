const slugify            = require('slugify');
const { pool }           = require('../config/db');
const { ok, fail, paginated } = require('../utils/apiResponse');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                                    AS total_users,
        (SELECT COUNT(*) FROM restaurants WHERE is_active=TRUE)         AS total_restaurants,
        (SELECT COUNT(*) FROM restaurants WHERE approval_status='pending') AS pending,
        (SELECT COUNT(*) FROM restaurants WHERE approval_status='approved') AS approved,
        (SELECT COUNT(*) FROM reservations)                             AS total_reservations,
        (SELECT COUNT(*) FROM reservations WHERE reservation_date=CURDATE()) AS today
    `);
    const [topRestaurants] = await pool.query(`
      SELECT r.name, r.city, COUNT(res.id) AS total
      FROM restaurants r
      LEFT JOIN reservations res ON res.restaurant_id=r.id
      WHERE r.approval_status='approved'
      GROUP BY r.id ORDER BY total DESC LIMIT 5
    `);
    return ok(res, { totals, topRestaurants });
  } catch (err) { next(err); }
};

// GET /api/admin/restaurants
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { page=1, limit=20, approval_status } = req.query;
    const offset = (Number(page)-1) * Number(limit);
    let where = 'WHERE 1=1';
    const params = [];
    if (approval_status) { where += ' AND r.approval_status=?'; params.push(approval_status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM restaurants r ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT r.*,
              u.first_name AS owner_first, u.last_name AS owner_last,
              u.email AS owner_email
       FROM restaurants r
       LEFT JOIN users u ON u.id=r.owner_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
};

// PUT /api/admin/restaurants/:id/approve
exports.approveRestaurant = async (req, res, next) => {
  try {
    await pool.query(
      "UPDATE restaurants SET approval_status='approved', rejection_reason=NULL WHERE id=?",
      [req.params.id]
    );
    return ok(res, null, 'Restaurant approuvé — il est maintenant visible.');
  } catch (err) { next(err); }
};

// PUT /api/admin/restaurants/:id/reject
exports.rejectRestaurant = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await pool.query(
      "UPDATE restaurants SET approval_status='rejected', rejection_reason=? WHERE id=?",
      [reason || null, req.params.id]
    );
    return ok(res, null, 'Restaurant refusé.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/restaurants/:id
exports.deleteRestaurant = async (req, res, next) => {
  try {
    await pool.query('UPDATE restaurants SET is_active=FALSE WHERE id=?', [req.params.id]);
    return ok(res, null, 'Restaurant supprimé.');
  } catch (err) { next(err); }
};

// GET /api/admin/reservations
exports.getAllReservations = async (req, res, next) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const offset = (Number(page)-1) * Number(limit);
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND r.status=?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations r ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT r.*, rest.name AS restaurant_name,
              u.first_name, u.last_name, u.email AS user_email
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

// PUT /api/admin/reservations/:id/status
exports.updateResvStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','cancelled','completed','no_show'];
    if (!valid.includes(status)) return fail(res, 'Statut invalide.', 400);
    await pool.query('UPDATE reservations SET status=? WHERE id=?',
      [status, req.params.id]);
    return ok(res, null, `Statut mis à jour : ${status}`);
  } catch (err) { next(err); }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page=1, limit=20 } = req.query;
    const offset = (Number(page)-1) * Number(limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email,
              u.is_active, u.created_at, r.name AS role,
              COUNT(res.id) AS total_reservations
       FROM users u
       JOIN roles r ON r.id=u.role_id
       LEFT JOIN reservations res ON res.user_id=u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id == req.user.id)
      return fail(res, 'Impossible de supprimer votre propre compte.', 400);
    await pool.query('UPDATE users SET is_active=FALSE WHERE id=?', [req.params.id]);
    return ok(res, null, 'Utilisateur désactivé.');
  } catch (err) { next(err); }
};