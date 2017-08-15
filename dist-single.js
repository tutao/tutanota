"use strict"

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const Builder = require('systemjs-builder')
const version = require('./package.json').version
const env = require('./buildSrc/env.js')
const LaunchHtml = require('./buildSrc/LaunchHtml.js')
const spawnSync = require('child_process').spawnSync

const glob = require('glob')
const path = require("path")

const SystemConfig = require('./buildSrc/SystemConfig.js')
const builder = new Builder(SystemConfig.distBuildConfig()) // baseURL and configuration
const babelCompile = require('./buildSrc/Builder.js').babelCompile

let start = Date.now()

const DistDir = 'build/dist'

const bundles = {}


function getAsyncImports(file) {
	let appSrc = fs.readFileSync(path.resolve(__dirname, file), 'utf-8')
	const regExp = /_asyncImport\("(.*)"\)/g
	let match = regExp.exec(appSrc)
	let asyncImports = []
	while (match != null) {
		asyncImports.push(match[1])
		match = regExp.exec(appSrc)
	}
	//console.log(`async imports for ${file}: ${asyncImports.join(" + ")}`)
	return asyncImports
}

Promise.resolve()
	.then(() => {
		return Promise.all([
			builder.trace('src/app-small.js + src/system-resolve.js + ' + getAsyncImports('src/app.js').join(" + ") + " + src/login/LoginViewController.js + src/gui/base/icons/Icons.js"),
			//builder.trace('src/api/worker/WorkerImpl.js + src/api/entities/*/* + src/system-resolve.js'),
		]).then(trees => {
			let mainTree = trees[0]
			let workerTree = trees[1]

			return Promise.all([
				//bundle(workerTree, `${DistDir}/worker-sfx.js`, bundles),
				bundle(mainTree, `${DistDir}/main-sfx.js`, bundles),
			])
		})
	})
	.then(() => console.log(`\nBuild time: ${(Date.now() - start) / 1000}s`))


function clean() {
	return fs.removeAsync(DistDir)
		.then(() => fs.ensureDirAsync(DistDir + "/translations"))
}

const buildConfig = {
	minify: false,
	mangle: false, // destroys type information (e.g. used for bluebird catch blocks)
	runtime: false,
	sourceMaps: true,
	sourceMapContents: true
}

function bundle(src, targetFile, bundles) {
	return builder.buildStatic(src, targetFile, buildConfig).then(function (output) {
		bundles[path.basename(targetFile)] = output.modules.sort()
		console.log(`  > bundled ${targetFile}`);
		return bundles
	}).catch(function (err) {
		console.log('Build error');
		console.log(err);
		throw err
	})
}


function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}