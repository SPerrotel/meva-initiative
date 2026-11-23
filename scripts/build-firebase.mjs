// Bundles the Firebase modular SDK from node_modules into public/vendor/firebase/.
// One entry per product (same names as the old gstatic files) + shared hashed chunks,
// so firebase-app is a single instance shared by auth/firestore/database.
// Usage: node scripts/build-firebase.mjs
import { build } from "esbuild";

const options = {
  entryPoints: ["app", "auth", "firestore", "database"].map((p) => `src/js/firebase/firebase-${p}.js`),
  outdir: "public/vendor/firebase",
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  legalComments: "none",
  logLevel: "info",
};

await build(options);
