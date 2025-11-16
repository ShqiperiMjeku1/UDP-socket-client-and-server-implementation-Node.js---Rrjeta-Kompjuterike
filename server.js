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

function handleCommand(client, commandLine) {
  const parts = commandLine.trim().split(" ");
  const cmd = parts[0].toUpperCase();
  const args = parts.slice(1);

  messageLog.push({
    time: new Date().toISOString(),
    clientId: client.id,
    ip: client.address,
    cmd: commandLine,
  });

  if (!hasPermission(client.role, cmd)) {
    return "ERROR: Permission denied (vetëm admin ka qasje të plotë)";
  }

  switch (cmd) {
    case "LIST":
      return listFiles();

    case "READ": {
      const filename = args[0];
      if (!filename) return "ERROR: READ <filename>";
      return readFileContent(filename);
    }

    case "UPLOAD": {
      const filename = args[0];
      const base64Data = args.slice(1).join(" ");
      if (!filename || !base64Data) {
        return "ERROR: UPLOAD <filename> <base64Data>";
      }
      return saveUploadedFile(filename, base64Data);
    }

    case "DOWNLOAD": {
      const filename = args[0];
      if (!filename) return "ERROR: DOWNLOAD <filename>";
      const res = getFileForDownload(filename);
      if (res.error) return res.error;
      return `FILEDATA ${res.filename} ${res.base64}`;
    }

    case "DELETE": {
      const filename = args[0];
      if (!filename) return "ERROR: DELETE <filename>";
      return deleteFile(filename);
    }

    case "SEARCH": {
      const keyword = args[0];
      if (!keyword) return "ERROR: SEARCH <keyword>";
      return searchFiles(keyword);
    }

    case "INFO": {
      const filename = args[0];
      if (!filename) return "ERROR: INFO <filename>";
      return fileInfo(filename);
    }

    case "MSG": {
      return `Mesazh u pranua nga ${client.id}: ${args.join(" ")}`;
    }

    default:
      return `ERROR: Komanda e panjohur: ${cmd}`;
  }
}