const Promise = require('bluebird')
const path = require("path")
const Builder = require('./buildSrc/Builder.js').Builder
const builder = new Builder(path.join(__dirname, '.'), path.join(__dirname, "build/"))
const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const env = require('./buildSrc/env.js')
const LaunchHtml = require('./buildSrc/LaunchHtml.js')
const SystemConfig = require('./buildSrc/SystemConfig.js')
const os = require("os")

let start = new Date().getTime()

let promise = Promise.resolve()
if (process.argv.indexOf("clean") !== -1) {
	promise = builder.clean()
}

let watch = process.argv.indexOf("watch") === -1 ? undefined : () => {
	}

promise
	.then(() => fs.copyAsync(path.join(__dirname, '/resources/favicon'), path.join(__dirname, '/build/images')))
	.then(() => fs.copyAsync(path.join(__dirname, '/resources/images/'), path.join(__dirname, '/build/images')))
	.then(() => fs.copyAsync(path.join(__dirname, '/libs'), path.join(__dirname, '/build/libs')))
	.then(() => {
		const version = require('./package.json').version
		if (process.argv.indexOf("test") !== -1) {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(), "https://test.tutanota.com", version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(), "https://test.tutanota.com", version, "App"))
			])
		} else if (process.argv.indexOf("prod") !== -1) {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(), "https://mail.tutanota.com", version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(), "https://mail.tutanota.com", version, "App"))
			])
		} else {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(), null, version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(), "http://" + os.hostname().split(".")[0] + ":9000", version, "App"))
			])
		}
	})
	.then(() => builder.build(["src"], watch))
	.then(() => {
		let time = Math.round((new Date().getTime() - start) / 1000 * 100) / 100
		console.log(`\n >>> Build completed in ${time}s\n`)
	})
	.then(() => {
		if (process.argv.indexOf("watch") !== -1) {
			require('chokidar-socket-emitter')({port: 9082, path: 'build', relativeTo: 'build'})
		}
	})


function createHtml(env) {
	let filenamePrefix = (env.mode == "App") ? "app" : "index"
	let imports = SystemConfig.baseDevDependencies.concat([`${filenamePrefix}.js`])
	return Promise.all([
		_writeFile(`./build/${filenamePrefix}.js`, [
			`window.whitelabelCustomizations = null`,
			`window.env = ${JSON.stringify(env, null, 2)}`,
			`System.config(env.systemConfig)`,
			`System.import("src/system-resolve.js").then(function() { System.import('src/bootstrapHotReload.js') })`
		].join("\n")),
		_writeFile(`./build/${filenamePrefix}.html`, LaunchHtml.renderHtml(imports, env))
	])
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}
