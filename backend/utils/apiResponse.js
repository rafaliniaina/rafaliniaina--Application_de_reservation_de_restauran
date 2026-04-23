const ok = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = 'Erreur', status = 500) =>
  res.status(status).json({ success: false, message });

const paginated = (res, data, total, page, limit) =>
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
      hasPrev:    page > 1,
    },
  });

module.exports = { ok, fail, paginated };