import { expandGlob } from "jsr:@std/fs@1.0.5";
import lume from "lume/mod.ts";

import esbuild from "lume/plugins/esbuild.ts";
import basePath from "lume/plugins/base_path.ts";

const site = lume({
  src: "./src",
  location: new URL(
    "https://open-innovations.github.io/culturedale-audience-tool/",
  ),
});

site.use(esbuild({
  extensions: [".ts"],
  options: {
    plugins: [],
    bundle: true,
    format: "esm",
    minify: false,
    keepNames: true,
    platform: "browser",
    target: "esnext",
    treeShaking: true,
    outdir: "./",
    outbase: ".",
  },
}));

site.use(basePath());

{
  const root = import.meta.resolve("./").replace("file://", "");
  const lookupFiles = (await Array.fromAsync(expandGlob("./lookup/**/*json")))
    .map((x) => x.path);
  lookupFiles.forEach((f) =>
    site.remoteFile(
      f.replace(root, ""),
      f,
    )
  );
  site.copy("lookup");
}

site.copy([".css"]);
site.copy("assets/vendor");

export default site;
