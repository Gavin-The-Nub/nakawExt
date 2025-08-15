// split-modules.js
const fs = require("fs");

const code = fs.readFileSync("background.js", "utf8");

// Match every "<number>: function(...){ ... }"
const moduleMatches = [
  ...code.matchAll(
    /(\d+)\s*:\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*(?=,\s*\d+:|}\)\s*;)/g
  ),
];

if (!moduleMatches.length) {
  console.log("❌ No Webpack-style modules found in background.js");
  process.exit(1);
}

fs.mkdirSync("modules", { recursive: true });

moduleMatches.forEach(([_, id, body]) => {
  const filePath = `modules/${id}.js`;
  fs.writeFileSync(filePath, body.trim());
});

console.log(`✅ Extracted ${moduleMatches.length} modules into /modules`);
