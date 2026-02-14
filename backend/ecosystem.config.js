module.exports = {
  apps: [
    {
      name: "vitalflow-backend",
      script: "src/app.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      // Log configuration
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      log_type: "json",

      // Restart configuration
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "1G",

      // Watch configuration (disable in production)
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads", ".git"],

      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Health check
      health_check_grace_period: 3000,
      health_check_http: "/health",
      health_check_interval: 10000,

      // Environment variables
      env_file: "/var/www/vitalflow/backend/.env",

      // Additional settings
      merge_logs: true,
      autorestart: true,

      // Custom configuration
      node_args: "--max-old-space-size=2048",
    },
  ],

  deploy: {
    production: {
      user: "www-data",
      host: "13.233.167.118",
      ref: "origin/main",
      repo: "git@github.com:jarvishiv62/careops-hackathon.git",
      path: "/var/www/vitalflow/backend",
      "pre-deploy-local": "",
      "post-deploy":
        "mkdir -p logs && npm ci --production && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "mkdir -p /var/www/vitalflow/backend/logs",
      ssh_options: "StrictHostKeyChecking=no",
    },
  },
};
