require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const compression = require('compression');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/restaurants',  require('./routes/restaurants'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/owner',        require('./routes/owner'));
app.use('/api/admin',        require('./routes/admin'));

app.get('/api/health', (_req, res) =>
  res.json({ success:true, status:'OK', db: process.env.DB_NAME })
);

app.use((_req, res) =>
  res.status(404).json({ success:false, message:'Route introuvable' })
);

app.use(errorHandler);

module.exports = app;