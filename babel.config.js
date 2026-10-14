module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // NOUVEAU : alias "@/" pour importer comme dans les fichiers web
    // (@/lib/..., @/context/..., @/helpers/...) au lieu de chemins relatifs.
    // Nécessite : npm install -D babel-plugin-module-resolver
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./" },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
