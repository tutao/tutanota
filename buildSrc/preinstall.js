import { $ } from "zx"

await $`git config core.hooksPath githooks`
await $({ stdio: "inherit", cwd: "src/mimimi" })`npm i`
