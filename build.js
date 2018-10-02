const options = require('commander')
const Promise = require('bluebird')
const path = require("path")
const Builder = require('./buildSrc/Builder.js').Builder
const builder = new Builder(path.join(__dirname, '.'), path.join(__dirname, "build/"))
const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const env = require('./buildSrc/env.js')
const LaunchHtml = require('./buildSrc/LaunchHtml.js')
const SystemConfig = require('./buildSrc/SystemConfig.js')
const os = require("os")

const packageJSON = require('./package.json')
const version = packageJSON.version
let start = new Date().getTime()

options
	.usage('[options] [test|prod|URL] ')
	.arguments('<targetUrl>')
	.option('-c, --clean', 'Clean build directory')
	.option('-w, --watch', 'Watch build dir for changes and rebuild if necessary')
	.option('-d, --desktop', 'assemble & start desktop client')
	.parse(process.argv)
options.host = options.args[0]

let promise = Promise.resolve()

if (options.clean) {
	promise = builder.clean()
}


let watch = !options.watch ? undefined : () => {}

promise
	.then(() => fs.copyAsync(path.join(__dirname, '/resources/favicon'), path.join(__dirname, '/build/images')))
	.then(() => fs.copyAsync(path.join(__dirname, '/resources/images/'), path.join(__dirname, '/build/images')))
	.then(() => fs.copyAsync(path.join(__dirname, '/libs'), path.join(__dirname, '/build/libs')))
	.then(() => {
		if (options.host === 'test') {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(true), "https://test.tutanota.com", version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(true), "https://test.tutanota.com", version, "App")),
				createHtml(env.create(SystemConfig.devConfig(true), "https://test.tutanota.com", version, "Desktop"))
			])
		} else if (options.host === 'prod') {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(true), "https://mail.tutanota.com", version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(true), "https://mail.tutanota.com", version, "App")),
				createHtml(env.create(SystemConfig.devConfig(true), "https://mail.tutanota.com", version, "Desktop"))
			])
		} else if (options.host) {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(true), options.host, version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(false), options.host, version, "App")),
				createHtml(env.create(SystemConfig.devConfig(true), options.host, version, "Desktop"))
			])
		} else {
			return Promise.all([
				createHtml(env.create(SystemConfig.devConfig(true), null, version, "Browser")),
				createHtml(env.create(SystemConfig.devConfig(true),
					"http://" + os.hostname().split(".")[0] + ":9000", version, "App")),
				createHtml(env.create(SystemConfig.devConfig(true), null, version, "Desktop"))
			])
		}
	})
	.then(() => builder.build(["src"], watch))
	.then(() => {
		if (options.desktop) {
			console.log("Building desktop client...")
			const electronSourcesDir = path.join(__dirname, '/app-desktop')
			return fs.emptyDirAsync(electronSourcesDir + "/resources/")
			         .then(() => {
				         return Promise.all([
					         fs.copyAsync(path.join(__dirname, '/build/images'), electronSourcesDir + "/resources/images"),
					         fs.copyAsync(path.join(__dirname, '/build/libs'), electronSourcesDir + "/resources/libs"),
					         fs.copyAsync(path.join(__dirname, '/build/src'), electronSourcesDir + "/resources/src"),
					         fs.copyAsync(path.join(__dirname, '/build/desktop.html'), electronSourcesDir + "/resources/desktop.html"),
					         fs.copyAsync(path.join(__dirname, '/build/desktop.js'), electronSourcesDir + "/resources/desktop.js")
				         ])
			         })
			         .then(() => {
				         console.log("Trying to start desktop client...")
				         fs.unlink('./desktop_out.log', (e) => {})
				         const out = fs.openSync('./desktop_out.log', 'a');
				         const err = fs.openSync('./desktop_out.log', 'a');
				         //need to run "npm install --save-dev electron" in directory first
				         spawn("/bin/sh", ["-c", "npm start"], {
					         cwd: path.join(__dirname, '/app-desktop/'),
					         stdio: ['ignore', out, err],
					         detached: true
				         }).unref()
			         })
		}
	})
	.then(() => {
		let now = new Date().getTime()
		let time = Math.round((now - start) / 1000 * 100) / 100
		console.log(`\n >>> Build completed in ${time}s\n`)
	})
	.then(() => {
		if (options.watch) {
			require('chokidar-socket-emitter')({port: 9082, path: 'build', relativeTo: 'build'})
		}
	})


function createHtml(env) {
	let filenamePrefix
	switch (env.mode) {
		case "App":
			filenamePrefix = "app"
			break
		case "Browser":
			filenamePrefix = "index"
			break
		case "Desktop":
			filenamePrefix = "desktop"
	}
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
