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
