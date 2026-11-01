const express = require('express');
const cors = require('cors');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const { initSchema } = require('./db/database');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const recruiterRoutes = require('./routes/recruiter');
const placementRoutes = require('./routes/placement');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const demoRoutes = require('./routes/demo');
const demoClockRoutes = require('./routes/demoClock');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database tables
initSchema();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CAMPUSLINK AI Placement & Analytics Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/demo-clock', demoClockRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 CAMPUSLINK Server running on http://localhost:${PORT}`);
});
