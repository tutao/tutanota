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
const spawn = require('child_process').spawn
const desktopBuilder = require("./buildSrc/DesktopBuilder")

const packageJSON = require('./package.json')
const version = packageJSON.version
let start = new Date().getTime()
let targetUrl = "http://" + os.hostname().split(".")[0] + ":9000"

options
	.usage('[options] [test|prod|[URL]] ')
	.arguments('<targetUrl>')
	.option('-c, --clean', 'Clean build directory')
	.option('-w, --watch', 'Watch build dir and rebuild if necessary')
	.option('-d, --desktop', 'assemble & start desktop client')
	.parse(process.argv)
options.host = options.args[0]
let promise = Promise.resolve()

if (options.clean) {
	promise = builder.clean()
}


let watch = !options.watch ? undefined : () => {}

promise
	.then(prepareAssets)
	.then(() => builder.build(["src"], watch))
	.then(startDesktop)
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

function prepareAssets() {
	return Promise.resolve()
	              .then(() => fs.copyAsync(path.join(__dirname, '/resources/favicon'), path.join(__dirname, '/build/images')))
	              .then(() => fs.copyAsync(path.join(__dirname, '/resources/images/'), path.join(__dirname, '/build/images')))
	              .then(() => fs.copyAsync(path.join(__dirname, '/libs'), path.join(__dirname, '/build/libs')))
	              .then(() => {
		              if (options.host === 'test') {
			              targetUrl = 'https://test.tutanota.com'
		              } else if (options.host === 'prod') {
			              targetUrl = 'https://mail.tutanota.com'
		              } else if (options.host === 'local') {
			              targetUrl = "http://" + os.hostname().split(".")[0] + ":9000"
		              } else if (options.host) {
			              targetUrl = options.host
		              }
		              console.log('targetUrl: ', targetUrl)

		              return Promise.all([
			              createHtml(env.create(SystemConfig.devConfig(true), targetUrl, version, "Browser")),
			              createHtml(env.create(SystemConfig.devConfig(true), targetUrl, version, "App")),
			              createHtml(env.create(SystemConfig.devConfig(false), targetUrl, version, "Desktop"))
		              ])
	              })
}

function startDesktop() {
	if (options.desktop) {
		console.log("Building desktop client...")
		console.log("Trying to start desktop client...")
		const packageJSON = require('./buildSrc/electron-package-json-template.js')(
			"",
			"0.0.1",
			targetUrl,
			path.join(__dirname, "/resources/desktop-icons/logo-solo-red.png"),
			false
		)
		const content = JSON.stringify(packageJSON)
		return fs.writeFileAsync("./build/package.json", content, 'utf-8')
		         .then(() => {
			         return desktopBuilder.trace(
				         ['./src/desktop/DesktopMain.js', './src/desktop/preload.js'],
				         __dirname,
				         path.join(__dirname, '/build/')
			         )
		         })
		         .then(() => {
			         spawn("/bin/sh", ["-c", "npm start"], {
				         stdio: ['ignore', 'inherit', 'inherit'],
				         detached: false
			         })
		         })
	}
}

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
			`window.nativeApp = Object.assign({}, window.nativeApp)`,
			`System.config(env.systemConfig)`,
			`System.import("src/system-resolve.js").then(function() { System.import('src/bootstrapHotReload.js') })`
		].join("\n")),
		_writeFile(`./build/${filenamePrefix}.html`, LaunchHtml.renderHtml(imports, env))
	])
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}
