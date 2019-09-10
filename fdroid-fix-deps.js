// Script which removes dependencies with binaries which raise F-Droid alarms.

const fs = require('fs')
const packageJson = require('./package.json')

;[
	"electron-builder",
	'electron',
	"electron-localshortcut",
	"electron-packager",
	"electron-updater",
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

fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "  "))
