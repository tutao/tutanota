import { execSync } from "child_process"

try {
	execSync("git config core.hooksPath githooks", { stdio: "inherit" })
} catch (e) {
	console.error("failed to setup githook ", e)
}
execSync("npm ci", { stdio: "inherit", cwd: "src/app-kits/mimimi" })
