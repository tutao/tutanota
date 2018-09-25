const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")

function packageDesktop(dirname, version) {
	console.log("Building desktop client for v" + version + "...")
	const electronSourcesDir = path.join(dirname, '/app-desktop/dist/')
	const resourcesDir = path.join(electronSourcesDir, "/resources/")

	//prepare files
	return fs.removeAsync(electronSourcesDir)
	         .then(() => {
		         return Promise.all([
			         fs.copyAsync(path.join(dirname, '/build/dist/'), resourcesDir),
			         fs.copyAsync(path.join(dirname, '/app-desktop/', '/main.js'), path.join(electronSourcesDir, "main.js")),
			         fs.copyAsync(path.join(dirname, '/app-desktop/', '/src/'), path.join(electronSourcesDir, "/src/"))
		         ])
	         })
	         .then(() => {
		         //remove app & browser stuff
		         return Promise.all([
			         fs.unlink(resourcesDir + "app.html", (e) => {}),
			         fs.unlink(resourcesDir + "app.js", (e) => {}),
			         fs.unlink(resourcesDir + "index.js", (e) => {}),
			         fs.unlink(resourcesDir + "index.html", (e) => {})
		         ])
	         })
	         .then(() => {
		         console.log("Creating config...")
		         //create package.json for electron-builder
		         const builderPackageJSON = Object.assign(require(path.join(dirname, '/app-desktop/', '/package.json')), {
			         version: version
		         })
		         builderPackageJSON.build.icon = path.join(dirname, "/resources/desktop-icons/desktop-icon.png")
		         return fs.writeFile(path.join(electronSourcesDir, "/package.json"),
			         JSON.stringify(builderPackageJSON),
			         'utf8',
			         (e) => {
				         if (e) {
					         console.log("couldn't write package.json: ", e);
				         }
			         })
	         })
	         .then(() => {
		         //package for linux, win, mac
		         const builder = require("electron-builder")
		         return builder.build({
			         _: ['build'],
			         win: [],
			         mac: [],
			         linux: [],
			         p: 'always',
			         project: electronSourcesDir
		         })
	         })
}

module.exports = {
	packageDesktop
}