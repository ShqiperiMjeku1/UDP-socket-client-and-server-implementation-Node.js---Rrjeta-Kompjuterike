const path = require("path");

module.exports = {
  SERVER_PORT: 5000,

  SERVER_IP: "localhost",
  MAX_CLIENTS: 4,
  CLIENT_TIMEOUT_MS: 60_000,
  SHARED_FOLDER: path.join(__dirname, "shared"),
  STATS_LOG_FILE: path.join(__dirname, "server_stats.txt"),
};