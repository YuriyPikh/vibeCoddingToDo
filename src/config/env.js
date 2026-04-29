const fs = require("fs");
const path = require("path");

const rootDir = resolveRootDir();
const vercelTempTodosFile = "/tmp/todos.json";
loadEnvFiles();
const dataDir = path.join(rootDir, "data");
const buildMeta = readBuildMeta();

function resolveRootDir() {
  const candidateDirectories = [
    path.resolve(__dirname, "../.."),
    process.cwd(),
  ];

  for (const candidate of candidateDirectories) {
    if (hasRuntimeFiles(candidate)) {
      return candidate;
    }
  }

  return candidateDirectories[0];
}

function hasRuntimeFiles(directoryPath) {
  return ["views", "public"].every((entry) => fs.existsSync(path.join(directoryPath, entry)));
}

function loadEnvFiles() {
  const mode = resolveEnvMode(process.env.NODE_ENV, process.env.BUILD_TYPE);
  const envFiles = [path.join(rootDir, ".env")];

  if (mode !== "development") {
    envFiles.push(path.join(rootDir, `.env.${mode}`));
  }

  const inheritedKeys = new Set(Object.keys(process.env));
  const loadedValues = {};

  for (const envFile of envFiles) {
    Object.assign(loadedValues, readEnvFile(envFile));
  }

  for (const [key, value] of Object.entries(loadedValues)) {
    if (!inheritedKeys.has(key)) {
      process.env[key] = value;
    }
  }
}

function resolveEnvMode(nodeEnv, buildType) {
  if (typeof nodeEnv === "string" && nodeEnv.trim()) {
    return nodeEnv.trim();
  }

  if (typeof buildType === "string" && buildType.trim()) {
    return buildType.trim();
  }

  return "development";
}

function readEnvFile(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const entries = {};

    for (const rawLine of fileContents.split(/\r?\n/u)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      entries[key] = unwrapEnvValue(value);
    }

    return entries;
  } catch {
    return {};
  }
}

function unwrapEnvValue(value) {
  const isWrappedInQuotes =
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"));

  return isWrappedInQuotes ? value.slice(1, -1) : value;
}

function resolvePort(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 3000;
  }

  return parsed;
}

function isVercelRuntime(runtimeEnv = process.env) {
  return runtimeEnv.VERCEL === "1" || typeof runtimeEnv.VERCEL_ENV === "string";
}

function resolveTodosFile(rawValue, runtimeEnv = process.env) {
  if (!rawValue) {
    if (isVercelRuntime(runtimeEnv)) {
      return vercelTempTodosFile;
    }

    return path.join(dataDir, "todos.json");
  }

  return path.isAbsolute(rawValue) ? rawValue : path.join(rootDir, rawValue);
}

function readBuildMeta() {
  try {
    const buildMetaPath = path.join(rootDir, "build-meta.json");
    const parsed = JSON.parse(fs.readFileSync(buildMetaPath, "utf8"));

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function resolveUiBadgeWord(rawValue, fallback = "Core") {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const normalized = rawValue.trim();

  return normalized || fallback;
}

function resolveAssetPaths(rawAssets = {}) {
  return {
    stylesheet: resolveAssetPath(rawAssets, "/css/styles.css"),
    appScript: resolveAssetPath(rawAssets, "/js/app.js"),
  };
}

function resolveAssetPath(rawAssets, sourcePath) {
  if (!rawAssets || typeof rawAssets !== "object") {
    return sourcePath;
  }

  const assetPath = rawAssets[sourcePath];

  return typeof assetPath === "string" && assetPath.trim() ? assetPath : sourcePath;
}

module.exports = {
  resolvePort,
  resolveTodosFile,
  isVercelRuntime,
  resolveUiBadgeWord,
  resolveAssetPath,
  resolveAssetPaths,
  env: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: resolvePort(process.env.PORT),
    rootDir,
    dataDir,
    todosFile: resolveTodosFile(process.env.TODOS_FILE),
    buildType: process.env.BUILD_TYPE || buildMeta.buildType || process.env.NODE_ENV || "development",
    uiBadgeWord: resolveUiBadgeWord(process.env.UI_BADGE_WORD, buildMeta.uiBadgeWord || "Core"),
    assetPaths: resolveAssetPaths(buildMeta.assets),
  },
};
