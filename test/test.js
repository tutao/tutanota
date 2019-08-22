const Promise = require('bluebird')
const chalk = require('chalk')
const path = require("path")
const Builder = require('../buildSrc/Builder.js').Builder
const babelCompile = require('../buildSrc/Builder.js').babelCompile
const destDir = path.join(__dirname, "../build/")
const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const child_process = require('child_process')
const env = require('../buildSrc/env.js')
const LaunchHtml = require('../buildSrc/LaunchHtml.js')
const SystemConfig = require('../buildSrc/SystemConfig.js')

const builder = new Builder(path.join(__dirname, '../'), destDir)

let promise = Promise.resolve()
if (process.argv.indexOf("clean") !== -1) {
	promise = builder.clean()
}

var project = null
if (process.argv.indexOf("api") !== -1) {
	project = "api"
} else if (process.argv.indexOf("client") !== -1) {
	project = "client"
} else {
	console.error("must provide 'api' or 'client' to run the tests")
	process.exit(1)
}


let watch = process.argv.indexOf("watch") === -1 ? undefined : () => runTest()

promise.then(() => fs.copyAsync(path.join(__dirname, '../libs'), path.join(__dirname, '../build/libs')))
       .then(() => fs.readFileAsync('../src/api/worker/WorkerBootstrap.js', 'utf-8').then(bootstrap => {
	       let lines = bootstrap.split("\n")
	       lines[0] = lines[0].replace(/..\/..\/..\/..\/build\/libs/g, "../../../../libs")
	       let code = babelCompile(lines.join("\n")).code
	       return fs.writeFileAsync('../build/src/api/worker/WorkerBootstrap.js', code, 'utf-8')
       }))
       .then(() => builder.build(["buildSrc/env.js", "src", "test/client", "test/api"], watch))
       .then(createUnitTestHtml)
       .then(runTest)
       .then((code) => {
	       if (process.argv.indexOf("watch") !== -1) {
		       require('chokidar-socket-emitter')({port: 9082, path: '../build', relativeTo: '../build'})
	       } else {
		       // If it's not watch, exit with the same exit code as test process so we can tell if tests failed
		       process.exit(code)
	       }
       })
       .catch(Error, e => {
	       if (e.message.startsWith('ENOENT')) {
		       console.log(`${chalk.red(e.message)}`)
		       console.log(`${chalk.green.bold("> Did you call make?")}`)
		       process.exit(1)
	       }
       })

let testRunner = null

function runTest() {
	if (testRunner != null) {
		console.log("> skipping test run as test are already executed")
	} else {
		return new Promise((resolve) => {
			let testRunner = child_process.fork(`../build/test/${project}/bootstrapNode.js`)
			testRunner.on('exit', (code) => {
				resolve(code)
				testRunner = null
			})
		})
	}
}

function createUnitTestHtml() {
	let localEnv = env.create(SystemConfig.devTestConfig(), null, "unit-test", "Test")
	return Promise.all([
		_writeFile(`../build/test-${project}.js`, [
			`window.env = ${JSON.stringify(localEnv, null, 2)}`,
			`System.config(env.systemConfig)`,
			`System.import("src/system-resolve.js").then(function() { System.import('test/${project}/bootstrapBrowser.js') })`,
		].join("\n")),
		LaunchHtml.renderTestHtml(SystemConfig.baseDevDependencies.concat([`test-${project}.js`]))
		          .then((html) => _writeFile(`../build/test-${project}.html`, html))
	])
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}
