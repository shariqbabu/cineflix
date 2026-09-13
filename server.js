require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// Public configuration endpoint for client-side Supabase client
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    appScheme: process.env.APP_SCHEME || 'cineflix',
    appPackageName: process.env.APP_PACKAGE_NAME || 'com.cineflix.ott'
  });
});

// Route: Password Reset / Change Page
app.get(['/reset-password', '/auth/reset-password', '/change-password'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Route: Email Confirmation Page
app.get(['/confirm', '/auth/confirm', '/verify'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirm.html'));
});

// Route: Home / Status Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint

// Route: VIP Subscription 1-Click Approval
app.all(['/api/approve', '/approve'], require('./api/approve'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cineflix-auth-server', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  ðŸŽ¬ CineFlix Auth & Confirmation Server Started `);
  console.log(`  ðŸš€ Local URL: http://localhost:${PORT}`);
  console.log(`  ðŸ” Reset Password: http://localhost:${PORT}/reset-password`);
  console.log(`  âœ‰ï¸  Email Confirm: http://localhost:${PORT}/confirm`);
  console.log(`=================================================`);
});

