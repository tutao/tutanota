import { execSync } from "child_process"

execSync("git config core.hooksPath githooks", { stdio: "inherit" })
execSync("npm ci", { stdio: "inherit", cwd: "src/mimimi" })
