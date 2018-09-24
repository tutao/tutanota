const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")

function packageDesktop(dirname, packageJSON) {
	console.log("Building desktop client...")
	const electronSourcesDir = path.join(dirname, '/app-desktop/dist/')
	const resourcesDir = path.join(electronSourcesDir, "/resources/")
	const electronOutDir = path.join(electronSourcesDir, '/out/')

	const electronPackagerOptions = Object.assign(packageJSON.electronPackagerOptions, {
		'dir': electronSourcesDir,
		'out': electronOutDir,
		'appVersion': packageJSON.version,
		'overwrite': true,
	})

	const installerDebOptions = {
		src: path.join(electronOutDir, '/' + 'tutanota-desktop' + '-linux-x64/'),
		dest: path.join(electronOutDir, '/installers/'),
		arch: 'amd64',
		version: packageJSON.version,
		description: 'Electron client for Tutanota',
		productDescription: 'Tutanota, the secure email service with built-in end-to-end encryption',
		maintainer: 'tutao GmbH <hello@tutao.de>',
		icon: './resources/desktop-icons/icon-192.png'
	}

	// const installerWinOptions = {
	// 	appDirectory: path.join(electronOutDir, '/' + 'tutanota-desktop' + '-win32-x64/'),
	// 	outputDirectory: path.join(electronOutDir, '/installers/'),
	// 	authors: 'Tutao GmbH',
	// 	version: version,
	// 	iconURL: './resources/native-icons/icon-192.ico',
	// 	setupIcon: './resources/native-icons/icon-192.ico',
	// 	exe: 'tutanota-desktop.exe'
	// }

	return fs.removeAsync(electronSourcesDir)
	         .then(() => {
		         return Promise.all([
			         fs.copyAsync(path.join(dirname, '/build/dist/'), resourcesDir),
			         fs.copyAsync(path.join(dirname, '/app-desktop/', '/main.js'), path.join(electronSourcesDir, "main.js")),
			         fs.copyAsync(path.join(dirname, '/app-desktop/', '/package.json'), path.join(electronSourcesDir, "package.json")),
		         ])
	         })
	         .then(() => {
		         return Promise.all([
			         fs.unlink(resourcesDir + "app.html", (e) => {
				         if (e) {
					         console.log("error deleting app.html: ", e)
				         }
			         }),
			         fs.unlink(resourcesDir + "app.js", (e) => {
				         if (e) {
					         console.log("error deleting app.js: ", e)
				         }
			         })
		         ])
	         })
	         .then(() => {
		         return require('electron-packager')(electronPackagerOptions)
	         })
	         .then(() => {
		         console.log("Packaging desktop client...")

		         console.log(".deb...")
		         const installerDeb = require('electron-installer-debian')
		         const debPromise = installerDeb(installerDebOptions)
			         .then(() => console.log(`Successfully created .deb at ${installerDebOptions.dest}`))
			         .catch(err => {
				         console.error("Error while building win32 installer:", err, err.stack)
			         })
		         return debPromise
		         // console.log("windows...")
		         // const installerWin = require('electron-winstaller')
		         // const winPromise = installerWin.createWindowsInstaller(installerWinOptions)
		         //                                .then(() => console.log(`Successfully created win installer at ${installerWinOptions.outputDirectory}`))
		         //                                .catch(err => {
		         //                                   console.error("Error while building win32 installer:", err, err.stack)
		         //                                })
		         //return Promise.all([debPromise, winPromise])
	         })
}

module.exports = {
	packageDesktop
}