import { build } from "esbuild";
import pkg from "./package.json" with { type: "json" };

build({
  entryPoints: ["src/main.ts"],
  outdir: "dist",
  format: "esm",
  bundle: true,
  minify: true,
  treeShaking: true,
  external: [...Object.keys(pkg.peerDependencies)],
  logLevel: "info",
});
