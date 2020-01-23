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

options
	.usage('[options] [test|prod|local|host <url>], "local" is default')
	.arguments('[stage] [host]')
	.option('-c, --clean', 'Clean build directory')
	.option('-w, --watch', 'Watch build dir and rebuild if necessary')
	.option('-d, --desktop', 'assemble & start desktop client')
	.action(function (stage, host) {
		if (!["test", "prod", "local", "host", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)) {
			options.outputHelp()
			process.exit(1)
		}
		options.stage = stage || "local"
		options.host = host
	})
	.parse(process.argv)

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
	let restUrl
	return Promise.resolve()
	              .then(() => fs.copyAsync(path.join(__dirname, '/resources/favicon'), path.join(__dirname, '/build/images')))
	              .then(() => fs.copyAsync(path.join(__dirname, '/resources/images/'), path.join(__dirname, '/build/images')))
	              .then(() => fs.copyAsync(path.join(__dirname, '/libs'), path.join(__dirname, '/build/libs')))
	              .then(() => {
		              if (options.stage === 'test') {
			              restUrl = 'https://test.tutanota.com'
		              } else if (options.stage === 'prod') {
			              restUrl = 'https://mail.tutanota.com'
		              } else if (options.stage === 'local') {
			              restUrl = "http://" + os.hostname().split(".")[0] + ":9000"
		              } else { // host
			              restUrl = options.host
		              }

		              return Promise.all([
			              createHtml(env.create(SystemConfig.devConfig(true), (options.stage
				              === 'local') ? null : restUrl, version, "Browser")),
			              createHtml(env.create(SystemConfig.devConfig(true), restUrl, version, "App")),
			              createHtml(env.create(SystemConfig.devConfig(false), restUrl, version, "Desktop"))
		              ])
	              })
}

function startDesktop() {
	if (options.desktop) {
		console.log("Trying to start desktop client...")
		const version = require('./package.json').version
		const packageJSON = require('./buildSrc/electron-package-json-template.js')(
			"-debug",
			version,
			"http://localhost:9000",
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
			`System.config(env.systemConfig)`,
			`System.import("src/system-resolve.js").then(function() {
				return System.import(${options.watch ? "'src/bootstrapHotReload.js'" : "'src/app.js'"})
			})`
		].join("\n")),
		LaunchHtml.renderHtml(imports, env).then((content) => _writeFile(`./build/${filenamePrefix}.html`, content))
	])
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}
