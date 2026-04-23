const { pool }           = require('../config/db');
const { ok, fail, paginated } = require('../utils/apiResponse');

// GET /api/restaurants
exports.getAll = async (req, res, next) => {
  try {
    const { page=1, limit=9, search='', city='', cuisine='', price='' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let where = "WHERE r.is_active=TRUE AND r.approval_status='approved'";

    if (search.trim()) {
      where += ' AND (r.name LIKE ? OR r.city LIKE ? OR r.cuisine_type LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (city.trim())    { where += ' AND r.city=?';         params.push(city.trim()); }
    if (cuisine.trim()) { where += ' AND r.cuisine_type=?'; params.push(cuisine.trim()); }
    if (price)          { where += ' AND r.price_range=?';  params.push(Number(price)); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM restaurants r ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT r.id, r.name, r.slug, r.city, r.cuisine_type,
              r.price_range, r.cover_image, r.description,
              ROUND(AVG(rv.rating),1) AS avg_rating,
              COUNT(rv.id)            AS review_count
       FROM restaurants r
       LEFT JOIN reviews rv ON rv.restaurant_id = r.id
       ${where}
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/restaurants/:id
exports.getOne = async (req, res, next) => {
  try {
    const [[restaurant]] = await pool.query(
      `SELECT r.*,
              ROUND(AVG(rv.rating),1) AS avg_rating,
              COUNT(rv.id)            AS review_count
       FROM restaurants r
       LEFT JOIN reviews rv ON rv.restaurant_id = r.id
       WHERE r.id=? AND r.is_active=TRUE AND r.approval_status='approved'
       GROUP BY r.id`,
      [req.params.id]
    );
    if (!restaurant) return fail(res, 'Restaurant introuvable', 404);

    const [tables] = await pool.query(
      'SELECT * FROM `tables` WHERE restaurant_id=? ORDER BY capacity',
      [req.params.id]
    );
    const [reviews] = await pool.query(
      `SELECT rv.rating, rv.comment, rv.created_at,
              u.first_name, u.last_name
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       WHERE rv.restaurant_id=?
       ORDER BY rv.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    return ok(res, { ...restaurant, tables, reviews });
  } catch (err) { next(err); }
};