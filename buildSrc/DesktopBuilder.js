const Promise = require('bluebird')
const Builder = require('./Builder.js').Builder
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")

function build(dirname, version, targets, targetUrl, updateSubDir) {
	const targetString = Object.keys(targets)
	                           .filter(k => typeof targets[k] !== "undefined")
	                           .join(" ")
	console.log("Building desktop client for v" + version + " (" + targetString + ")...")
	const updateUrl = targetUrl + "/" + updateSubDir
	const distDir = path.join(dirname, '/build/dist/')

	console.log("Updating config...")
	const content = require('./electron-package-json-template')(
		version,
		updateUrl,
		path.join(dirname, "/resources/desktop-icons/desktop-icon.png")
	)
	let writeConfig = fs.writeFileAsync("./build/dist/package.json", JSON.stringify(content), 'utf-8')

	//prepare files
	return writeConfig
		.then(() => {
			return fs.removeAsync(path.join(distDir, "..", updateSubDir))
		})
		.then(() => {
			return new Builder(dirname, distDir)
				.build(['src/desktop'], false)
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
				project: distDir
			})
		})
		.then(() => {
			console.log("Move output to /build/dist/" + updateSubDir + "/...")
			return Promise.all(
				fs.readdirSync(path.join(distDir, '/installers'))
				  .filter((file => file.startsWith(content.name) || file.endsWith('.yml')))
				  .map(file => fs.moveAsync(
					  path.join(distDir, '/installers/', file),
					  path.join(distDir, `../${updateSubDir}`, file)
					  )
				  )
			).then(() => Promise.all([
				// fs.removeAsync(path.join(distDir, '/installers/')),
			    fs.removeAsync(path.join(distDir, '/node_modules/')),
			    fs.removeAsync(path.join(distDir, '/cache.json')),
				fs.removeAsync(path.join(distDir, '/src/')),
			]))
		})
}

module.exports = {
	build
}