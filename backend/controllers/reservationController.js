const crypto             = require('crypto');
const { pool }           = require('../config/db');
const { ok, fail, paginated } = require('../utils/apiResponse');

const genCode = () => 'RES-' + crypto.randomBytes(3).toString('hex').toUpperCase();

// POST /api/reservations
exports.create = async (req, res, next) => {
  try {
    const { restaurant_id, reservation_date, reservation_time,
            party_size, special_requests } = req.body;

    if (!restaurant_id || !reservation_date || !reservation_time || !party_size)
      return fail(res, 'Tous les champs obligatoires sont requis.', 422);

    // Vérifier restaurant approuvé
    const [[rest]] = await pool.query(
      "SELECT id FROM restaurants WHERE id=? AND is_active=TRUE AND approval_status='approved'",
      [restaurant_id]
    );
    if (!rest) return fail(res, 'Restaurant introuvable.', 404);

    // Trouver une table disponible
    const [tables] = await pool.query(
      `SELECT t.id FROM \`tables\` t
       WHERE t.restaurant_id=? AND t.capacity>=?
         AND t.id NOT IN (
           SELECT table_id FROM reservations
           WHERE restaurant_id=? AND reservation_date=?
             AND reservation_time=? AND status NOT IN ('cancelled','no_show')
             AND table_id IS NOT NULL
         )
       ORDER BY t.capacity ASC LIMIT 1`,
      [restaurant_id, party_size, restaurant_id, reservation_date, reservation_time]
    );

    const table_id = tables[0]?.id || null;
    const code     = genCode();

    const [result] = await pool.query(
      `INSERT INTO reservations
         (user_id,restaurant_id,table_id,reservation_date,reservation_time,
          party_size,special_requests,confirmation_code)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, restaurant_id, table_id, reservation_date,
       reservation_time, party_size, special_requests || null, code]
    );

    const [[resv]] = await pool.query(
      `SELECT r.*, rest.name AS restaurant_name, rest.address
       FROM reservations r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       WHERE r.id=?`,
      [result.insertId]
    );

    return ok(res, resv, 'Réservation créée avec succès !', 201);
  } catch (err) { next(err); }
};

// GET /api/reservations/mine
exports.getMine = async (req, res, next) => {
  try {
    const { page=1, limit=10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let where = 'WHERE r.user_id=?';
    const params = [req.user.id];
    if (status) { where += ' AND r.status=?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations r ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT r.*, rest.name AS restaurant_name,
              rest.address, rest.cover_image
       FROM reservations r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       ${where}
       ORDER BY r.reservation_date DESC, r.reservation_time DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
};

// DELETE /api/reservations/:id
exports.cancel = async (req, res, next) => {
  try {
    const [[resv]] = await pool.query(
      'SELECT * FROM reservations WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!resv) return fail(res, 'Réservation introuvable.', 404);
    if (!['pending','confirmed'].includes(resv.status))
      return fail(res, `Impossible d'annuler une réservation "${resv.status}".`, 400);

    await pool.query(
      "UPDATE reservations SET status='cancelled' WHERE id=?",
      [req.params.id]
    );
    return ok(res, null, 'Réservation annulée.');
  } catch (err) { next(err); }
};