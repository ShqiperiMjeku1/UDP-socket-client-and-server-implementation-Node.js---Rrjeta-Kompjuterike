const dgram = require("dgram");
const fs = require("fs");
const {
  SERVER_PORT,
  MAX_CLIENTS,
  CLIENT_TIMEOUT_MS,
  STATS_LOG_FILE,
} = require("./config");
const {
  listFiles,
  readFileContent,
  saveUploadedFile,
  getFileForDownload,
  deleteFile,
  searchFiles,
  fileInfo,
} = require("./fileService");

const server = dgram.createSocket("udp4");

const clients = new Map();

let totalBytesIn = 0;
let totalBytesOut = 0;
let totalMessages = 0;
const messageLog = [];

function getClientKey(rinfo) {
  return `${rinfo.address}:${rinfo.port}`;
}

function registerClient(key, clientId, role, rinfo) {
  if (!clients.has(key)) {
    if (clients.size >= MAX_CLIENTS) {
      return false;
    }
    clients.set(key, {
      id: clientId,
      role,
      address: rinfo.address,
      port: rinfo.port,
      lastSeen: Date.now(),
      messages: 0,
      bytesIn: 0,
      bytesOut: 0,
    });
    console.log(
      `→ Klient i ri: id=${clientId}, role=${role}, ip=${rinfo.address}, port=${rinfo.port}`
    );
  }
  return true;
}

function isAdmin(role) {
  return role.toLowerCase() === "admin";
}

function hasPermission(role, command) {
  const cmd = command.toUpperCase();
  const readOnlyAllowed = ["LIST", "READ", "DOWNLOAD", "SEARCH", "INFO", "MSG"];
  if (isAdmin(role)) return true;
  return readOnlyAllowed.includes(cmd);
}
