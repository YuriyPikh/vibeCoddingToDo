import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const distDir = path.join(rootDir, "dist");
const sourcePublicDir = path.join(rootDir, "public");
const distPublicDir = path.join(distDir, "public");
const distAssetsDir = path.join(distPublicDir, "assets");

const copyTargets = ["src", "views"];

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const buildMeta = {
  buildType: process.env.BUILD_TYPE || "development",
  uiBadgeWord: process.env.UI_BADGE_WORD || "Core",
  assets: buildPublicAssets(),
};

for (const target of copyTargets) {
  const sourcePath = path.join(rootDir, target);
  const destinationPath = path.join(distDir, target);

  if (!existsSync(sourcePath)) {
    continue;
  }

  cpSync(sourcePath, destinationPath, { recursive: true });
}

copyRuntimeData();
writeFileSync(path.join(distDir, "build-meta.json"), `${JSON.stringify(buildMeta, null, 2)}\n`);

console.log(
  `Build output written to ${distDir} (${buildMeta.buildType}: ${buildMeta.uiBadgeWord}, ${Object.keys(buildMeta.assets).length} hashed assets)`,
);

function buildPublicAssets() {
  if (!existsSync(sourcePublicDir)) {
    return {};
  }

  mkdirSync(distAssetsDir, { recursive: true });

  const assets = {};

  for (const assetPath of walkFiles(sourcePublicDir)) {
    const relativePath = path.relative(sourcePublicDir, assetPath);
    const normalizedSourcePath = `/${relativePath.replace(/\\/gu, "/")}`;
    const sourceContents = readFileSync(assetPath, "utf8");
    const optimizedContents = optimizeAsset(relativePath, sourceContents);
    const hashedRelativePath = createHashedAssetPath(relativePath, optimizedContents);
    const outputPath = path.join(distPublicDir, hashedRelativePath);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, optimizedContents);

    assets[normalizedSourcePath] = `/${hashedRelativePath.replace(/\\/gu, "/")}`;
  }

  return assets;
}

function walkFiles(directoryPath) {
  const nestedFiles = [];

  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      nestedFiles.push(...walkFiles(fullPath));
      continue;
    }

    nestedFiles.push(fullPath);
  }

  return nestedFiles;
}

function optimizeAsset(relativePath, sourceContents) {
  if (relativePath.endsWith(".css")) {
    return minifyCss(sourceContents);
  }

  if (relativePath.endsWith(".js")) {
    return minifyJs(sourceContents);
  }

  return sourceContents;
}

function minifyCss(sourceContents) {
  return sourceContents
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/\s+/gu, " ")
    .replace(/\s*([{}:;,>])\s*/gu, "$1")
    .replace(/;\}/gu, "}")
    .trim();
}

function minifyJs(sourceContents) {
  return sourceContents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function createHashedAssetPath(relativePath, contents) {
  const parsedPath = path.parse(relativePath);
  const folderSegments = parsedPath.dir ? parsedPath.dir.split(path.sep) : [];
  const fileName = `${parsedPath.name}-${createContentHash(contents)}${parsedPath.ext}`;

  return path.join("assets", ...folderSegments, fileName);
}

function createContentHash(contents) {
  return createHash("sha256").update(contents).digest("hex").slice(0, 8);
}

function copyRuntimeData() {
  const sourceTodosFile = path.join(rootDir, "data", "todos.json");
  const distDataDir = path.join(distDir, "data");

  if (!existsSync(sourceTodosFile) || !statSync(sourceTodosFile).isFile()) {
    return;
  }

  mkdirSync(distDataDir, { recursive: true });
  copyFileSync(sourceTodosFile, path.join(distDataDir, "todos.json"));
}
