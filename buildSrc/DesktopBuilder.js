const Promise = require('bluebird')
const babel = Promise.promisifyAll(require("babel-core"))
const fs = Promise.promisifyAll(require("fs-extra"))
const path = require("path")
const jsyaml = require('js-yaml')

function build(dirname, version, targets, updateUrl, nameSuffix) {
	const targetString = Object.keys(targets)
	                           .filter(k => typeof targets[k] !== "undefined")
	                           .join(" ")
	console.log("Building desktop client for v" + version + " (" + targetString + ")...")
	const updateSubDir = "desktop" + nameSuffix
	const distDir = path.join(dirname, '/build/dist/')

	console.log("Updating electron-builder config...")
	const content = require('./electron-package-json-template')(
		nameSuffix,
		version,
		updateUrl,
		path.join(dirname, "/resources/desktop-icons/logo-solo-red.png"),
		nameSuffix !== "-snapshot"
	)
	let writeConfig = fs.writeFileAsync("./build/dist/package.json", JSON.stringify(content), 'utf-8')

	//prepare files
	return writeConfig
		.then(() => {
			return fs.removeAsync(path.join(distDir, "..", updateSubDir))
		})
		.then(() => {
			console.log("Tracing dependencies...")
			transpile(['./src/desktop/DesktopMain.js', './src/desktop/preload.js'], dirname, distDir)
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
			//linux sig to yml
			const signatureFileName = fs.readdirSync(path.join(distDir, 'installers'))
			                            .find((file => file.startsWith(content.name) && file.endsWith('linux-sig.bin')))
			if (!signatureFileName) { // there is no linux signature
				return Promise.resolve()
			}
			console.log("Attaching signature to latest-linux.yml...")
			const ymlPath = path.join(distDir, 'installers', 'latest-linux.yml')
			let yml = jsyaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'))
			const sigPath = path.join(distDir, 'installers', signatureFileName)
			console.log("Writing signature to", sigPath)
			const signatureContent = fs.readFileSync(sigPath)
			yml.signature = signatureContent.toString('base64')
			fs.writeFileSync(ymlPath, jsyaml.safeDump(yml), 'utf8')
		})
		.then(() => {
			//win sig to yml
			const signatureFileName = fs.readdirSync(path.join(distDir, 'installers'))
			                            .find((file => file.startsWith(content.name) && file.endsWith('win-sig.bin')))
			if (!signatureFileName) { // there is no win signature
				return Promise.resolve()
			}
			console.log("Attaching signature to latest.yml...")
			const ymlPath = path.join(distDir, 'installers', 'latest.yml')
			let yml = jsyaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'))
			const sigPath = path.join(distDir, 'installers', signatureFileName)
			console.log("Writing signature to", sigPath)
			const signatureContent = fs.readFileSync(sigPath)
			yml.signature = signatureContent.toString('base64')
			fs.writeFileSync(ymlPath, jsyaml.safeDump(yml), 'utf8')
		})
		.then(() => {
			//mac sig to yml
			const signatureFileName = fs.readdirSync(path.join(distDir, 'installers'))
			                            .find((file => file.startsWith(content.name) && file.endsWith('mac-sig.bin')))
			if (!signatureFileName) { // there is no linux signature
				return Promise.resolve()
			}
			console.log("Attaching signature to latest-mac.yml...")
			const ymlPath = path.join(distDir, 'installers', 'latest-mac.yml')
			let yml = jsyaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'))
			const sigPath = path.join(distDir, 'installers', signatureFileName)
			console.log("Writing signature to", sigPath)
			const signatureContent = fs.readFileSync(sigPath)
			yml.signature = signatureContent.toString('base64')
			fs.writeFileSync(ymlPath, jsyaml.safeDump(yml), 'utf8')
		})
		.then(() => {
			console.log("Move output to /build/" + updateSubDir + "/...")
			return Promise.all(
				fs.readdirSync(path.join(distDir, '/installers'))
				  .filter((file => file.startsWith(content.name) || file.endsWith('.yml')))
				  .map(file => fs.moveAsync(
					  path.join(distDir, '/installers/', file),
					  path.join(distDir, `../${updateSubDir}`, file)
					  )
				  )
			).then(() => Promise.all([
				fs.removeAsync(path.join(distDir, '/installers/')),
				fs.removeAsync(path.join(distDir, '/node_modules/')),
				fs.removeAsync(path.join(distDir, '/cache.json')),
				fs.removeAsync(path.join(distDir, '/package.json')),
				fs.removeAsync(path.join(distDir, '/package-lock.json')),
				fs.removeAsync(path.join(distDir, '/src/')),
			]))
		})
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
		let targetPath = path.join(distDir, currentPath)
		if (transpiledFiles.indexOf(sourcePath) === -1) {
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
	console.log("transpiled files:")
	console.log(transpiledFiles.map(p => path.relative(".", p)).join("\n"))
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
	let result = babel.transform(src, {
		"plugins": [
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
	return result
}

module.exports = {
	build,
	trace: transpile
}