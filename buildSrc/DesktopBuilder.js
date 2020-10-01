const Promise = require('bluebird')
const babel = Promise.promisifyAll(require("babel-core"))
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")

function build(opts) {
	let {
		dirname, // directory this was called from
		version, // application version that gets built
		targets, // which desktop targets to build and how to package them
		updateUrl, // where the client should pull its updates from, if any
		nameSuffix, // suffix used to distinguish test-, prod- or snapshot builds on the same machine
		notarize, // for the MacOs notarization feature
		outDir, // where to copy the finished artifacts
		unpacked // output desktop client without packing it into an installer
	} = opts
	const targetString = Object.keys(targets)
	                           .filter(k => typeof targets[k] !== "undefined")
	                           .join(" ")
	console.log("Building desktop client for v" + version + " (" + targetString + ")...")
	const distDir = path.join(dirname, '/build/dist/')
	outDir = path.join(outDir || path.join(distDir, ".."), 'desktop' + nameSuffix)
	console.log("artifacts will be moved to", outDir)
	const requiredEntities = fs.readdirSync(path.join(dirname, './src/api/entities/sys/'))
	                           .map(fn => path.join(dirname, './src/api/entities/sys', fn))
	const languageFiles = fs.readdirSync(path.join(dirname, './src/translations/'))
	                        .map(fn => path.join(dirname, './src/translations', fn))

	console.log("Updating electron-builder config...")
	const content = require('./electron-package-json-template')({
		nameSuffix: nameSuffix,
		version: version,
		updateUrl: updateUrl,
		iconPath: path.join(dirname, "/resources/desktop-icons/logo-solo-red.png"),
		sign: nameSuffix !== '-snapshot' && updateUrl !== "",
		notarize: notarize,
		unpacked: unpacked
	})
	let writeConfig = fs.writeFileAsync("./build/dist/package.json", JSON.stringify(content), 'utf-8')

	//prepare files
	return writeConfig
		.then(() => fs.removeAsync(outDir))
		.then(() => {
			console.log("Tracing dependencies...")
			transpile(['./src/desktop/DesktopMain.js', './src/desktop/preload.js']
				.concat(requiredEntities)
				.concat(languageFiles), dirname, distDir)
		})
		.then(() => {
			console.log("Starting installer build...")
			//package for linux, win, mac
			const electronBuilder = require("electron-builder")
			return electronBuilder.build({
				_: ['build'],
				win: targets.win,
				mac: targets.mac,
				linux: targets.linux,
				p: 'always',
				project: distDir
			})
		})
		.then(() => {
			const installerDir = path.join(distDir, 'installers')
			console.log("Move artifacts to", outDir)
			const outFiles = fs.readdirSync(installerDir)
			let filesToCopy
			// the output of the builder is very inconsistently named and contains
			// files that are irrelevant to us. these filters enable us to copy them
			// without naming every possible file name explicitly
			if (unpacked) {
				// when the unpacked option is set, output is a directory for each platform, with
				// the mac directory missing the "-unpacked" suffix.
				filesToCopy = outFiles.filter(file => file.endsWith("-unpacked") || file === "mac")
			} else {
				// the installers start with the application name + suffix. the update manifests end in yml.
				filesToCopy = outFiles.filter(file => file.startsWith(content.name) || file.endsWith('.yml'))
			}

			return Promise.all(
				filesToCopy.map(file => fs.moveAsync(
					path.join(installerDir, file),
					path.join(outDir, file)
					)
				)
			)
		}).then(() => Promise.all([
			fs.removeAsync(path.join(distDir, '/installers/')),
			fs.removeAsync(path.join(distDir, '/node_modules/')),
			fs.removeAsync(path.join(distDir, '/cache.json')),
			fs.removeAsync(path.join(distDir, '/package.json')),
			fs.removeAsync(path.join(distDir, '/package-lock.json')),
			fs.removeAsync(path.join(distDir, '/src/')),
		]))
}

/**
 * takes files and transpiles them and their dependency tree from baseDir to distDir
 * @param files array of relative paths to baseDir
 * @param baseDir source Directory
 * @param distDir target Directory
 */
function transpile(files, baseDir, distDir) {
	let transpiledFiles = []
	let nextFiles = files.map((file) => path.relative(baseDir, file))
	while (nextFiles.length !== 0) {
		let currentPath = nextFiles.pop()
		let sourcePath = path.join(baseDir, currentPath)
		if (!transpiledFiles.includes(sourcePath)) {
			let {src, deps} = findDirectDepsAndTranspile(sourcePath)
			fs.mkdirsSync(path.dirname(path.resolve(distDir, currentPath)))
			fs.writeFileSync(path.join(distDir, currentPath), src, 'utf-8')
			transpiledFiles.push(sourcePath)
			let i;
			for (i = 0; i < deps.length; i++) {
				nextFiles.push(path.relative(baseDir, deps[i]))
			}
			//nextFiles.concat(deps)
			nextFiles = nextFiles.filter((elem, i) => nextFiles.indexOf(elem === i))
		}
	}
	return Promise.resolve()
}

/**
 * transpiles the source and finds direct dependencies
 * only finds files that are required by path (not by node module name)
 * @param filePath absolute path to the file
 * @returns {{src: *, deps: Array}} src: transpiled source, deps: array of absolute paths to dependencies
 */
function findDirectDepsAndTranspile(filePath) {
	let deps = []
	const regExpRequire = /require\(["'](\..*?)["']\)/g
	let src = babelCompile(fs.readFileSync(filePath, 'utf-8')).code

	let match = regExpRequire.exec(src)
	while (match != null) {
		if (match[1].indexOf(".js") === -1) {
			match[1] = match[1] + ".js"
		}
		let foundPath = path.join(path.dirname(filePath), match[1])
		deps.push(foundPath)
		match = regExpRequire.exec(src)
	}

	return {src, deps}
}

function babelCompile(src, srcFile) {
	return babel.transform(src, {
		"plugins": [
			"transform-object-rest-spread",
			"transform-flow-strip-types",
			"transform-class-properties",
		],
		"presets": [
			"bluebird",
			"es2015"
		],
		comments: false,
		babelrc: false,
		retainLines: true,
		sourceMaps: srcFile != null ? "inline" : false,
		filename: srcFile,
	})
}

module.exports = {
	build,
	trace: transpile
}
