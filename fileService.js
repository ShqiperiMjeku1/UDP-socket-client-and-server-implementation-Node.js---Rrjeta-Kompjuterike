// fileService.js
const fs = require("fs");
const path = require("path");
const { SHARED_FOLDER } = require("./config");


if (!fs.existsSync(SHARED_FOLDER)) {
  fs.mkdirSync(SHARED_FOLDER, { recursive: true });
}

function listFiles() {
  const files = fs.readdirSync(SHARED_FOLDER);
  return files.join("\n") || "(s ka asnjë file)";
}

function readFileContent(filename) {
  const filePath = path.join(SHARED_FOLDER, filename);
  if (!fs.existsSync(filePath)) {
    return `ERROR: File ${filename} nuk ekziston`;
  }
  const data = fs.readFileSync(filePath, "utf8");
  return data;
}

function saveUploadedFile(filename, base64Data) {
  const filePath = path.join(SHARED_FOLDER, filename);
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);
  return `OK: File ${filename} u ruajt në server`;
}

function getFileForDownload(filename) {
  const filePath = path.join(SHARED_FOLDER, filename);
  if (!fs.existsSync(filePath)) {
    return { error: `ERROR: File ${filename} nuk ekziston` };
  }
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  return { filename, base64 };
}

function deleteFile(filename) {
  const filePath = path.join(SHARED_FOLDER, filename);
  if (!fs.existsSync(filePath)) {
    return `ERROR: File ${filename} nuk ekziston`;
  }
  fs.unlinkSync(filePath);
  return `OK: File ${filename} u fshi`;
}

function searchFiles(keyword) {
  const files = fs.readdirSync(SHARED_FOLDER);
  const matched = files.filter((f) => f.includes(keyword));
  if (matched.length === 0) {
    return `S'u gjet asnjë file me fjalë kyçe "${keyword}"`;
  }
  return matched.join("\n");
}

function fileInfo(filename) {
  const filePath = path.join(SHARED_FOLDER, filename);
  if (!fs.existsSync(filePath)) {
    return `ERROR: File ${filename} nuk ekziston`;
  }
  const stats = fs.statSync(filePath);
  return (
    `Emri: ${filename}\n` +
    `Madhësia: ${stats.size} bytes\n` +
    `Krijuar: ${stats.birthtime}\n` +
    `Modifikuar: ${stats.mtime}`
  );
}

module.exports = {
  listFiles,
  readFileContent,
  saveUploadedFile,
  getFileForDownload,
  deleteFile,
  searchFiles,
  fileInfo,
};
