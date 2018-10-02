const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")

function build(dirname, version, targets, targetUrl) {
	console.log("Building desktop client for v" + version + " (" + targets + ")...")
	const updateSubdir = '/desktop'
	const updateUrl = targetUrl + updateSubdir
	const electronSourcesDir = path.join(dirname, '/app-desktop/dist/')
	const resourcesDir = path.join(electronSourcesDir, "/resources/")

	console.log("Updating config...")
	const builderPackageJSON = Object.assign(require(path.join(dirname, '/app-desktop/', '/package.json')), {
		version: version
	})
	builderPackageJSON.build.publish.url = updateUrl
	builderPackageJSON.build.icon = path.join(dirname, "/resources/desktop-icons/desktop-icon.png")

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
			              win: targets.win,
			              mac: targets.mac,
			              linux: targets.linux,
			              p: 'always',
			              project: electronSourcesDir
		              })
	              })
	              .then(() => {
		              console.log("Move output to /build/dist" + updateSubdir + "/...")
		              return Promise.all(
			              fs.readdirSync(path.join(electronSourcesDir, 'installers'))
			                .filter((file => file.startsWith(builderPackageJSON.name) || file.endsWith('.yml')))
			                .map(file => fs.copyAsync(
				                path.join(electronSourcesDir, '/installers/', file),
				                path.join(dirname, '/build/dist', updateSubdir, file)
				                )
			                )
		              ).then(() => fs.removeAsync(path.join(electronSourcesDir)))
	              })
}

module.exports = {
	build
}