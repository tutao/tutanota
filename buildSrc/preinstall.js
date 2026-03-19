import { $ } from "zx"
import os from "node:os"

await $`git config core.hooksPath githooks`
await $({ stdio: "inherit", cwd: "src/crypto" })`node --experimental-strip-types make.ts`
await $({ stdio: "inherit", cwd: "src/mimimi" })`npm i`
