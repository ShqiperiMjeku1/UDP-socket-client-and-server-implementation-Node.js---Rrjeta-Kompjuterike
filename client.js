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
