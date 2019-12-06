// Script which removes dependencies with binaries which raise F-Droid alarms.

const fs = require('fs')
const packageJson = require('./package.json')

;[
	'electron',
	"electron-builder",
	"electron-localshortcut",
	"electron-packager",
	"electron-updater",
	"electron-notarize",
	"electron-rebuild",
	"express",
	"flow-bin",
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

fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "  "))
