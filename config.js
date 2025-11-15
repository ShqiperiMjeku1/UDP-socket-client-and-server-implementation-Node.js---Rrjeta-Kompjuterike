const path = require("path");

module.exports = {
  SERVER_PORT: 5000,

  // IP e serverit në rrjet lokal (LAN)
  SERVER_IP: "10.180.78.144",
  MAX_CLIENTS: 4,
  CLIENT_TIMEOUT_MS: 60_000,
  SHARED_FOLDER: path.join(__dirname, "shared"),
  STATS_LOG_FILE: path.join(__dirname, "server_stats.txt"),
};