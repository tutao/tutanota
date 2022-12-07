// Script which removes dependencies with binaries which raise F-Droid alarms.

import fs from "fs"

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"))

;[
	'electron',
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
].forEach((dep) => {
	delete packageJson.devDependencies[dep]
})

;[
	"keytar"
].forEach((dep) => {
	delete packageJson.dependencies[dep]
})

delete packageJson.scripts["postinstall"]

fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "\t"))

// The project doesn't typecheck because removing dependencies also removes type definitions that are required by TS
// SO we just ignore that
const tsConfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf8"))
tsConfig.compilerOptions.noEmitOnError = false
fs.writeFileSync("./tsconfig.json", JSON.stringify(tsConfig, null, "\t"))
