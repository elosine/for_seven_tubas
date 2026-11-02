// PM2 process file for the box (DESIGN §9; AR-55). `pm2 start server/ecosystem.config.js`
module.exports = {
  apps: [{
    name: 'stand-server',
    script: 'server/server.js',
    cwd: __dirname + '/..',
    env: { NODE_ENV: 'production', PORT: 5300 },
    // ADMIN_KEY: set it in the shell that starts PM2, or let the server generate
    // one into server/data/admin.key on first start (printed once to the log).
    max_memory_restart: '300M',
    autorestart: true,
    restart_delay: 1000,
  }],
};
