"use strict"
const options = require('commander')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const Builder = require('systemjs-builder')
let version = require('./package.json').version
const env = require('./buildSrc/env.js')
const LaunchHtml = require('./buildSrc/LaunchHtml.js')
const spawnSync = require('child_process').spawnSync

const glob = require('glob')
const path = require("path")
const os = require("os")

const SystemConfig = require('./buildSrc/SystemConfig.js')
const builder = new Builder(SystemConfig.distBuildConfig()) // baseURL and configuration
const babelCompile = require('./buildSrc/Builder.js').babelCompile
const desktopBuilder = require('./buildSrc/DesktopBuilder.js')

let start = Date.now()

const DistDir = 'build/dist'
let targetUrl

const bundles = {}


function getAsyncImports(file) {
	let appSrc = fs.readFileSync(path.resolve(__dirname, file), 'utf-8')
	const regExp = /_asyncImport\(["|'](.*)["|']\)/g
	let match = regExp.exec(appSrc)
	let asyncImports = []
	while (match != null) {
		asyncImports.push(match[1])
		match = regExp.exec(appSrc)
	}
	//console.log(`async imports for ${file}: ${asyncImports.join(" + ")}`)
	return asyncImports
}

const distLoc = (filename) => `${DistDir}/${filename}`

options
	.usage('[options] [test|prod|URL] ')
	.arguments('<targetUrl>')
	.option('-p, --prebuilt', 'Use prebuilt Webapp files in /build/dist/')
	.option('-w --win', 'Build desktop client for windows')
	.option('-l --linux', 'Build desktop client for linux')
	.option('-m --mac', 'Build desktop client for mac')
	.option('-d, --deb', 'Build .deb package')
	.option('-r, --release', 'Release .deb and tag commit. Implies --deb.')
	.parse(process.argv)
options.host = options.args[0]

Promise.resolve()
       .then(processOptions)
       .then(buildWebapp)
       .then(buildDesktopClient)
       .then(packageDeb)
       .then(release)
       .then(() => console.log(`\nBuild time: ${measure()}s`))
       .catch(e => {
	       console.log("\nBuild error:", e)
	       process.exit(1)
       })

function processOptions() {
	options.desktop = {
		win: options.win ? [] : undefined,
		linux: options.linux ? [] : undefined,
		mac: options.mac ? [] : undefined
	}

	options.desktop = Object.values(options.desktop).reduce((prev, curr) => prev || !!curr, false)
		? options.desktop
		: undefined

	//set target url
	if (options.desktop || !options.prebuilt) {
		if (options.host === 'test') {
			targetUrl = "https://test.tutanota.com"
		} else if (options.host === 'prod') {
			targetUrl = "https://mail.tutanota.com"
		} else if (options.host) {
			targetUrl = options.host
		} else {
			version = options.deb ? new Date().getTime() : version
			targetUrl = "http://" + os.hostname().split(".")[0] + ":9000"
		}
		console.log("targetUrl: ", targetUrl)
	}

	//--release implies --deb
	options.deb = options.release ? true : options.deb
	return Promise.resolve()
}

function measure() {
	return (Date.now() - start) / 1000
}

function clean() {
	return fs.removeAsync("build")
	         .then(() => fs.ensureDirAsync(DistDir + "/translations"))
}

function buildWebapp() {
	if (options.prebuilt) {
		console.log("Found prebuilt option (-p). Skipping Webapp build.")
		return Promise.resolve()
	}
	return Promise.resolve()
	              .then(() => console.log("started cleaning", measure()))
	              .then(() => clean())
	              .then(() => console.log("started copying images", measure()))
	              .then(() => fs.copyAsync(path.join(__dirname, '/resources/favicon'), path.join(__dirname, '/build/dist/images')))
	              .then(() => fs.copyAsync(path.join(__dirname, '/resources/images'), path.join(__dirname, '/build/dist/images')))
	              .then(() => fs.readFileAsync('src/api/worker/WorkerBootstrap.js', 'utf-8').then(bootstrap => {
		              let lines = bootstrap.split("\n")
		              lines[0] = `importScripts('libs.js')`
		              let code = babelCompile(lines.join("\n")).code
		              return fs.writeFileAsync('build/dist/WorkerBootstrap.js', code, 'utf-8')
	              }))
	              .then(() => {
		              console.log("started tracing", measure())
		              return Promise.all([
			              builder.trace('src/api/worker/WorkerImpl.js + src/api/entities/*/* + src/system-resolve.js'),
			              builder.trace('src/app.js + src/system-resolve.js'),
			              builder.trace('src/gui/theme.js - libs/stream.js'),
			              builder.trace(getAsyncImports('src/app.js')
				              .concat(getAsyncImports('src/native/NativeWrapper.js'))
				              .concat([
					              "src/login/LoginViewController.js",
					              "src/gui/base/icons/Icons.js",
					              "src/search/SearchBar.js",
					              "src/register/terms.js"
				              ]).join(" + "))
		              ])
	              })
	              .then(([workerTree, bootTree, themeTree, mainTree]) => {
		              console.log("started bundling", measure())
		              let commonTree = builder.intersectTrees(workerTree, mainTree)
		              return Promise.all([
			              bundle(commonTree, distLoc("common.js"), bundles),
			              bundle(builder.subtractTrees(workerTree, commonTree), distLoc("worker.js"), bundles),
			              bundle(builder.subtractTrees(builder.subtractTrees(builder.subtractTrees(mainTree, commonTree), bootTree), themeTree), distLoc("main.js"), bundles),
			              bundle(builder.subtractTrees(themeTree, commonTree), distLoc("theme.js"), bundles),
			              bundle(builder.subtractTrees(bootTree, themeTree), distLoc("main-boot.js"), bundles)
		              ])
	              })
	              .then(() => console.log("creating language bundles"))
	              .then(() => createLanguageBundles(bundles))
	              .then(() => {
		              if (process.argv.indexOf("test") !== -1) {
			              targetUrl = "https://test.tutanota.com"
		              } else if (process.argv.indexOf("prod") !== -1) {
			              targetUrl = "https://mail.tutanota.com"
		              } else if (process.argv.indexOf("host") !== -1) {
			              targetUrl = process.argv[process.argv.indexOf("host") + 1]
		              } else {
			              version = process.argv.indexOf("deb") == -1 ? new Date().getTime() : version
			              targetUrl = "http://" + os.hostname().split(".")[0] + ":9000"
		              }
		              return Promise.all([
			              createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), options.host === null
				              ? null
				              : targetUrl, version, "Browser", true), bundles),
			              createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), targetUrl, version, "App", true), bundles),
			              createHtml(env.create(SystemConfig.distRuntimeConfig(bundles), targetUrl, version, "Desktop", true), bundles)
		              ])
	              })
	              .then(() => bundleSW(bundles))
	              .then(copyDependencies)
}

function buildDesktopClient() {
	if (options.desktop) {
		return desktopBuilder.build(__dirname, packageJSON.version, options.desktop, targetUrl)
	}
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

function bundleSW(bundles) {
	return fs.readFileAsync("src/serviceworker/sw.js", "utf8").then((content) => {
		const filesToCache = ["index.js", "WorkerBootstrap.js", "index.html", "libs.js"]
			.concat(Object.keys(bundles).filter(b => !b.startsWith("translations")))
			.concat(fs.readdirSync(distLoc("images")).map(f => `images/${f}`))
		// Using "function" to hoist declaration, var wouldn't work in this case and we cannot prepend because
		// of "delcare var"
		const customDomainFileExclusions = ["index.html", "index.js"]
		content = content + "\n" + "function filesToCache() { return " + JSON.stringify(filesToCache) + "}"
			+ "\n function version() { return \"" + version + "\"}"
			+ "\n" + "function customDomainCacheExclusions() { return " + JSON.stringify(customDomainFileExclusions)
			+ "}"
		return babelCompile(content).code
	}).then((content) => _writeFile(distLoc("sw.js"), content))
}

function copyDependencies() {
	let libs = SystemConfig.baseProdDependencies.map(file => fs.readFileSync(file, 'utf-8')).join("\n")
	return fs.writeFileSync('build/dist/libs.js', libs, 'utf-8')
}

function createHtml(env, bundles) {
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
	let imports = ["libs.js", "main-boot.js", `${filenamePrefix}.js`]
	return Promise.all([
		_writeFile(`./build/dist/${filenamePrefix}.js`, [
			`window.whitelabelCustomizations = null`,
			`window.env = ${JSON.stringify(env, null, 2)}`,
			`window.bridge = Object.assign({}, window.bridge)`,
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

function packageDeb() {
	if (options.deb) {
		console.log("create " + debName)
		exitOnFail(spawnSync("/usr/bin/find", `. ( -name *.js -o -name *.html ) -exec gzip -fkv --best {} \;`.split(" "), {
			cwd: __dirname + '/build/dist',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/usr/local/bin/fpm", `-f -s dir -t deb --deb-user tutadb --deb-group tutadb -n tutanota-next-${version} -v 1 dist/=/opt/releases/tutanota-next-${version}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
	}
}

function release() {
	if (options.release) {
		console.log("Create git tag and copy .deb")
		exitOnFail(spawnSync("/usr/bin/git", `tag -a tutanota-release-${version} -m ''`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/usr/bin/git", `push origin tutanota-release-${version}`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/bin/cp", `-f build/${debName} /opt/repository/tutanota/`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		// user puppet needs to read the deb file from jetty
		exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${debName}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
	}
}

function exitOnFail(result) {
	if (result.status != 0) {
		throw new Error("error invoking process" + JSON.stringify(result))
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
