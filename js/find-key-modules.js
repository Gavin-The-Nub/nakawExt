// find-key-modules.js
const fs = require("fs");
const path = require("path");

const keywords = [
  "chrome.runtime",
  "chrome.storage",
  "chrome.tabs",
  "fetch(",
  "XMLHttpRequest",
  "http://",
  "https://",
];

const modulesDir = path.join(__dirname, "modules");
const files = fs.readdirSync(modulesDir).filter((f) => f.endsWith(".js"));

files.forEach((file) => {
  const content = fs.readFileSync(path.join(modulesDir, file), "utf8");
  const found = keywords.filter((k) => content.includes(k));
  if (found.length) {
    console.log(`${file}: ${found.join(", ")}`);
  }
});
