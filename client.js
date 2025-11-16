const dgram = require("dgram");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { SERVER_PORT, SERVER_IP } = require("./config");


const clientSocket = dgram.createSocket("udp4");

const clientId = process.argv[2] || "client1";
const role = process.argv[3] || "read";


console.log(`Client ID: ${clientId}, role: ${role}`);
console.log("Komandat:");
console.log("  /list");
console.log("  /read <filename>");
console.log("  /upload <local_filename>");
console.log("  /download <filename>");
console.log("  /delete <filename>   (vetëm admin)");
console.log("  /search <keyword>");
console.log("  /info <filename>");
console.log("  <tekst i lirë>  (dergohet si mesazh MSG)\n");


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function sendToServer(commandLine) {
  const payload = `${clientId}|${role}|${commandLine}`;
  const buffer = Buffer.from(payload, "utf8");
  clientSocket.send(buffer, SERVER_PORT, SERVER_IP, (err) => {
    if (err) console.error("Error në dërgim:", err);
  });
}

function handleUserInput(line) {
  line = line.trim();
  if (!line) return;


  if (line.startsWith("/list")) {
    sendToServer("LIST");
  } else if (line.startsWith("/read ")) {
    const filename = line.slice(6).trim();
    sendToServer(`READ ${filename}`);
  } else if (line.startsWith("/upload ")) {
    const localPath = line.slice(8).trim();
    fs.readFile(localPath, (err, data) => {
      if (err) {
        console.error("Nuk mund të lexoj file lokal:", err.message);
        return;
      }
      const base64 = data.toString("base64");
      const filename = path.basename(localPath);
      sendToServer(`UPLOAD ${filename} ${base64}`);
      console.log(`(Duke dërguar ${filename} në server)`);
    });
  } else if (line.startsWith("/download ")) {
    const filename = line.slice(10).trim();
    sendToServer(`DOWNLOAD ${filename}`);
  } else if (line.startsWith("/delete ")) {
    const filename = line.slice(8).trim();
    sendToServer(`DELETE ${filename}`);
  } else if (line.startsWith("/search ")) {
    const keyword = line.slice(8).trim();
    sendToServer(`SEARCH ${keyword}`);
  } else if (line.startsWith("/info ")) {
    const filename = line.slice(6).trim();
    sendToServer(`INFO ${filename}`);
  } else {
    sendToServer(`MSG ${line}`);
  }
}


rl.on("line", handleUserInput);

clientSocket.on("message", (msg) => {
  const text = msg.toString("utf8");


  if (text.startsWith("FILEDATA ")) {
    const parts = text.split(" ");
    const filename = parts[1];
    const base64Data = parts.slice(2).join(" ");
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFile(filename, buffer, (err) => {
      if (err) {
        console.error("Gabim në ruajtjen e file-it:", err.message);
      } else {
        console.log(`File ${filename} u shkarkua dhe u ruajt lokalisht.`);
      }
    });
  } else {
    console.log(`Server: \n${text}\n`);
  }
});
