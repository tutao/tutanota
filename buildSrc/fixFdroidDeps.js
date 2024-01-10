// Script which removes dependencies with binaries which raise F-Droid alarms.

import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"))

const devDependencies = [
	"electron",
	"electron-builder",
	"electron-localshortcut",
	"electron-packager",
	"electron-updater",
	"@electron/notarize",
	"electron-rebuild",
	"express",
	"request",
	"chokidar",
	"body-parser",
	"rcedit",
	"winreg",
	"node-forge",
]
for (const dep of devDependencies) {
	delete packageJson.devDependencies[dep]
}

delete packageJson.scripts["postinstall"]

fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "\t"))

// The project doesn't typecheck because removing dependencies also removes type definitions that are required by TS
// SO we just ignore that
const tsConfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf8"))
tsConfig.compilerOptions.noEmitOnError = false
fs.writeFileSync("./tsconfig.json", JSON.stringify(tsConfig, null, "\t"))
