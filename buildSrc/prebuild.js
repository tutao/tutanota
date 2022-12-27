import { $ } from "zx"

await $`npm run build-packages`
// We preserve const enums because when other packages consume .js (e.g. admin w/ esbuild) they don't see them
await $`tsc --noEmit false --outDir build/prebuilt --declaration true --declarationMap true --incremental true --preserveConstEnums true`
await $`cp src/*.d.ts build/prebuilt`
