const dgram = require("dgram");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { SERVER_PORT, SERVER_IP } = require("./config");


const clientSocket = dgram.createSocket("udp4");


// clientId dhe roli merren nga argumentet e komandës
// shembull:  node client.js admin1 admin
const clientId = process.argv[2] || "client1";
const role = process.argv[3] || "read"; // "admin" ose "read"


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

// Trajtimi i inputit nga user-i
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
    // mesazh i thjeshtë tekstual
    sendToServer(`MSG ${line}`);
  }
}


rl.on("line", handleUserInput);
