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
const os = require("os")

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

clean()
	.then(() => fs.copyAsync(path.join(__dirname, '/resources/favicon'), path.join(__dirname, '/build/dist/images')))
	.then(() => fs.copyAsync(path.join(__dirname, '/resources/images'), path.join(__dirname, '/build/dist/images')))
	.then(() => fs.readFileAsync('src/api/worker/WorkerBootstrap.js', 'utf-8').then(bootstrap => {
		let lines = bootstrap.split("\n")
		lines[0] = `importScripts('libs.js')`
		let code = babelCompile(lines.join("\n")).code
		return fs.writeFileAsync('build/dist/WorkerBootstrap.js', code, 'utf-8')
	}))
	.then(() => {
		return Promise.all([
			builder.trace('src/api/worker/WorkerImpl.js + src/api/entities/*/* + src/system-resolve.js'),
			builder.trace('src/app.js + src/system-resolve.js'),
			builder.trace('src/gui/theme.js - libs/stream.js'),
			builder.trace(getAsyncImports('src/app.js').join(" + ") + " + src/login/LoginViewController.js + src/gui/base/icons/Icons.js"),
		]).then(trees => {
			let workerTree = trees[0]
			let bootTree = trees[1]
			printTraceReport(bootTree)
			let themeTree = trees[2]
			let mainTree = trees[3]

			let commonTree = builder.intersectTrees(workerTree, mainTree)
			return Promise.all([
				bundle(commonTree, `${DistDir}/common.js`, bundles),
				bundle(builder.subtractTrees(workerTree, commonTree), `${DistDir}/worker.js`, bundles),
				bundle(builder.subtractTrees(builder.subtractTrees(builder.subtractTrees(mainTree, commonTree), bootTree), themeTree), `${DistDir}/main.js`, bundles),
				bundle(builder.subtractTrees(themeTree, commonTree), `${DistDir}/theme.js`, bundles),
				bundle(builder.subtractTrees(bootTree, themeTree), `${DistDir}/main-boot.js`, bundles),
			])
		})
	})
	.then(() => createLanguageBundles(bundles))
	.then(() => {
		if (process.argv.indexOf("test") !== -1) {
			return Promise.all([
				createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), "https://test.tutanota.com", version, "Browser", true), bundles),
				createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), "https://test.tutanota.com", version, "App", true), bundles)
			])
		} else if (process.argv.indexOf("prod") !== -1) {
			return Promise.all([
				createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), "https://mail.tutanota.com", version, "Browser", true), bundles),
				createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), "https://mail.tutanota.com", version, "App", true), bundles)
			])
		} else {
			return Promise.all([
				createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), null, version, "Browser", true), bundles),
				createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), "http://" + os.hostname().split(".")[0] + ":9000", version, "App", true), bundles)
			])
		}
	})
	.then(copyDependencies)
	.then(deb)
	.then(release)
	.then(() => console.log(`\nBuild time: ${(Date.now() - start) / 1000}s`))
	.catch(e => {
		console.log("\nBuild error:", e)
		process.exit(1)
	})


function clean() {
	return fs.removeAsync(DistDir)
		.then(() => fs.ensureDirAsync(DistDir + "/translations"))
}

const buildConfig = {
	minify: true,
	mangle: false, // destroys type information (e.g. used for bluebird catch blocks)
	runtime: false,
	sourceMaps: true,
	sourceMapContents: true
}

function bundle(src, targetFile, bundles) {
	return builder.bundle(src, targetFile, buildConfig).then(function (output) {
		bundles[path.basename(targetFile)] = output.modules.sort()
		console.log(`  > bundled ${targetFile}`);
		return bundles
	}).catch(function (err) {
		console.log('Build error in bundle ' + targetFile);
		throw err
	})
}

function copyDependencies() {
	let libs = SystemConfig.baseProdDependencies.map(file => fs.readFileSync(file, 'utf-8')).join("\n")
	return fs.writeFileSync('build/dist/libs.js', libs, 'utf-8')
}

function createHtml(env, bundles) {
	let filenamePrefix = (env.mode == "App") ? "app" : "index"
	let imports = ["libs.js", "main-boot.js", `${filenamePrefix}.js`]
	return Promise.all([
		_writeFile(`./build/dist/${filenamePrefix}.js`, [
			`window.env = ${JSON.stringify(env, null, 2)}`,
			`System.config(env.systemConfig)`,
			`System.import("src/system-resolve.js").then(function() { System.import('src/app.js') })`,
		].join("\n")),
		_writeFile(`./build/dist/${filenamePrefix}.html`, LaunchHtml.renderHtml(imports, env))
	])
}

function createLanguageBundles(bundles) {
	return Promise.all(glob.sync('src/translations/*.js').map(translation => {
		let filename = path.basename(translation)
		return builder.bundle(translation, {
			minify: false,
			mangle: false,
			runtime: false,
			sourceMaps: false
		}).then(function (output) {
			const bundle = `${DistDir}/translations/${filename}`
			bundles["translations/" + filename] = output.modules.sort()
			fs.writeFileSync(bundle, output.source, 'utf-8')
			console.log(`  > bundled ${bundle}`);
		})
	})).then(() => bundles)
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}


let debName = `tutanota-next-${version}_1_amd64.deb`
function deb() {
	if (process.argv.indexOf("deb") !== -1) {
		console.log("create" + debName)
		spawnSync("/usr/bin/find", `. ( -name *.js -o -name *.html ) -exec gzip -fkv --best {} \;`.split(" "), {
			cwd: __dirname + '/build/dist',
			stdio: [process.stdin, process.stdout, process.stderr]
		})

		spawnSync("/usr/local/bin/fpm", `-f -s dir -t deb --deb-user tutadb --deb-group tutadb -n tutanota-next-${version} -v 1 dist/=/opt/releases/tutanota-next-${version}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		})

	}
}

function release() {
	if (process.argv.indexOf("release") !== -1) {
		console.log("create git tag and copy .deb")
		spawnSync("/usr/bin/git", `tag -a tutanota-release-${version} -m ''`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		})

		spawnSync("/usr/bin/git", `push origin tutanota-release-${version}`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		})

		spawnSync("/bin/cp", `-f build/${debName} /opt/repository/tutanota/`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		})

		// user puppet needs to read the deb file from jetty
		spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${debName}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		})
	}
}

function printTraceReport(trace) {
	function formatNumber(number) {
		number = number + ""
		while (number.length < 6) {
			number = '0' + number
		}
		return number
	}

	let size = 0
	let filesAndSizes = Object.keys(trace).map(file => {
		return {
			file,
			length: trace[file].source.length
		}
	}).sort((a, b) => a.length - b.length)

	console.log(filesAndSizes.map(o => formatNumber(o.length) + ": " + o.file).join("\n" + "  > "))
}