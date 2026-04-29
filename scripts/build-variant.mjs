const [buildType = "development", uiBadgeWord = "Core"] = process.argv.slice(2);

process.env.BUILD_TYPE = buildType;
process.env.UI_BADGE_WORD = uiBadgeWord;

await import("./build.mjs");
