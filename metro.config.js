const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure ttf is resolved as an asset
if (!config.resolver.assetExts.includes("ttf")) {
  config.resolver.assetExts.push("ttf");
}

// Add support for mjs file resolution
if (!config.resolver.sourceExts.includes("mjs")) {
  config.resolver.sourceExts.push("mjs");
}

module.exports = withNativeWind(config, { input: "./src/global.css" });
