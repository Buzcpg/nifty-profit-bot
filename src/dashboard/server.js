const path = require('path');
const express = require('express');
const basicAuth = require('express-basic-auth');
const {
  getAllStats,
  getConfig,
  setConfig,
  getRecentProfits,
  getLeaderboard,
  getUserStats,
} = require('../db/database');

const app = express();
const port = process.env.DASHBOARD_PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  '/admin',
  basicAuth({
    users: {
      admin: process.env.DASHBOARD_ADMIN_PASSWORD || 'changeme',
    },
    challenge: true,
  })
);

app.get('/', (_req, res) => {
  res.redirect('/admin');
});

app.get('/admin', (_req, res) => {
  const stats = getAllStats();
  const announceChannel = getConfig('announce_channel');
  const recentProfits = getRecentProfits(20);

  res.render('admin', { stats, announceChannel, recentProfits });
});

app.post('/admin/config', (req, res) => {
  const announceChannel = req.body.announce_channel;
  setConfig('announce_channel', announceChannel);
  res.redirect('/admin');
});

app.get('/leaderboard', (_req, res) => {
  const leaderboard = getLeaderboard(20);
  res.render('leaderboard', { leaderboard });
});

app.get('/dashboard/:userId', (req, res) => {
  const { userId } = req.params;
  const stats = getUserStats(userId);
  res.render('user', { stats, userId });
});

app.listen(port, () => {
  console.log(`Dashboard server running on port ${port}`);
});
