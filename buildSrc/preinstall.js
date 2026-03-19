import { $ } from "zx"

await $`git config core.hooksPath githooks`
await $({ stdio: "inherit", cwd: "src/crypto" })`node --experimental-strip-types make.ts`
