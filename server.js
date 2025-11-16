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
function sendResponse(client, rinfo, text) {
  const buffer = Buffer.from(text, "utf8");
  const delay = isAdmin(client.role) ? 0 : 500;

  setTimeout(() => {
    server.send(buffer, rinfo.port, rinfo.address, (err) => {
      if (err) console.error("Error në dërgim:", err);
    });
    client.bytesOut += buffer.length;
    totalBytesOut += buffer.length;
  }, delay);
}
server.on("message", (msg, rinfo) => {
  const key = getClientKey(rinfo);
  const text = msg.toString("utf8").trim();
  totalBytesIn += msg.length;
  totalMessages++;

  const parts = text.split("|");
  if (parts.length < 3) {
    const errMsg = "ERROR: Mesazh i pavlefshëm. Formati: clientId|role|komanda";
    const buf = Buffer.from(errMsg, "utf8");
    server.send(buf, rinfo.port, rinfo.address);
    return;
  }

  const clientId = parts[0];
  const role = parts[1];
  const commandLine = parts.slice(2).join("|");

  if (!registerClient(key, clientId, role, rinfo)) {
    const buf = Buffer.from("ERROR: Serveri është i mbushur (MAX_CLIENTS)", "utf8");
    server.send(buf, rinfo.port, rinfo.address);
    return;
  }

  const client = clients.get(key);
  client.lastSeen = Date.now();
  client.messages++;
  client.bytesIn += msg.length;

  const response = handleCommand(client, commandLine);
  sendResponse(client, rinfo, response);
});

server.on("listening", () => {
  const address = server.address();
  console.log(`UDP server duke dëgjuar në port ${address.port}`);
  console.log(`Përdor komandën "STATS" në këtë terminal për statistika.\n`);
});

setInterval(() => {
  const now = Date.now();
  for (const [key, client] of clients.entries()) {
    if (now - client.lastSeen > CLIENT_TIMEOUT_MS) {
      console.log(
        `Lidhja me klientin ${client.id} (${client.address}:${client.port}) u mbyll për shkak të mosaktivitetit.`
      );
      clients.delete(key);
    }
  }
}, 5_000);

server.bind(SERVER_PORT);

function printStats() {
  const lines = [];
  lines.push("===== SERVER STATS =====");
  lines.push(`Koha: ${new Date().toISOString()}`);
  lines.push(`Lidhje aktive: ${clients.size}`);
  lines.push(`Total mesazhe: ${totalMessages}`);
  lines.push(`Bytes pranuar: ${totalBytesIn}`);
  lines.push(`Bytes dërguar: ${totalBytesOut}`);
  lines.push("Klientët aktivë:");

  for (const client of clients.values()) {
    lines.push(
      `- id=${client.id}, role=${client.role}, ip=${client.address}, msg=${client.messages}, in=${client.bytesIn}, out=${client.bytesOut}`
    );
  }

  const output = lines.join("\n") + "\n\n";
  console.log(output);
  fs.appendFileSync(STATS_LOG_FILE, output);
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (data) => {
  const cmd = data.trim().toUpperCase();
  if (cmd === "STATS") {
    printStats();
  }
});