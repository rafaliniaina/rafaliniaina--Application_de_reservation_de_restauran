class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const errorHandler = (err, _req, res, _next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Erreur interne du serveur';

  if (err.code === 'ER_DUP_ENTRY')
    return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });

  res.status(status).json({ success: false, message });
};

module.exports = { AppError, errorHandler };