const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")

function build(dirname, version, targets, updateUrl) {
	console.log("Building desktop client for v" + version + " (" + targets + ")...")

	const electronSourcesDir = path.join(dirname, '/app-desktop/dist/')
	const resourcesDir = path.join(electronSourcesDir, "/resources/")

	//prepare files
	return Promise.resolve()
	              .then(() => {
		              console.log("Cleaning up...")
		              return fs.removeAsync(electronSourcesDir)
	              })
	              .then(() => {
		              //copy webapp files to app-desktop folder
		              console.log("Copying files...")
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
		              console.log("Updating config...")
		              //create package.json for electron-builder
		              const builderPackageJSON = Object.assign(require(path.join(dirname, '/app-desktop/', '/package.json')), {
			              version: version
		              })
		              builderPackageJSON.build.publish.url = updateUrl
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
		              console.log("Starting installer build...")
		              //package for linux, win, mac
		              const builder = require("electron-builder")
		              return builder.build({
			              _: ['build'],
			              win: targets.includes('w') ? [] : undefined,
			              mac: targets.includes('m') ? [] : undefined,
			              linux: targets.includes('l') ? [] : undefined,
			              p: 'always',
			              project: electronSourcesDir
		              })
	              })
}

module.exports = {
	build
}