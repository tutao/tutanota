/*
	This file contains logic for compiling the native keytar module for the current platform.
	It can be executed without any arguments and will figure all required information (electron-version, keytar directory, ...) by itself.

	You can use the --verbose option to get more output from the build command (gyp), there also is a --debug option that will pass the
	DEBUG flag to the keytar build.
 */
import {spawn} from "child_process"
import fs from "fs-extra"
import options from "commander"
import path, {dirname} from "path"
import {fileURLToPath} from "url"
import {createRequire} from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url))

let opts
options
	.usage('[options]')
	.option('-v, --verbose', 'Verbose output')
	.option('-d, --debug', 'Build keytar with DEBUG flag')
	.action(() => {
		opts = options.opts()
	})
	.parse(process.argv)

buildKeytarForElectron(opts)

async function buildKeytarForElectron(opts) {
	console.log("Compiling keytar from source using gyp ...")

	const arch = process.arch
	const verbose = opts.verbose || false
	const debug = opts.debug || false
	const distUrl = "https://electronjs.org/headers"
	const electronVersion = await readElectronVersionFromPackageDotJson()
	const gypCommand = "rebuild"
	const modulePath = findKeytarModuleDir()
	const gypOpts = [
		"--build-from-source",
		"--runtime=electron",
		`--target=${electronVersion}`,
		`--dist-url=${distUrl}`,
		`--arch=${arch}`
	]

	if (debug) {
		gypOpts.push("--debug")
	} else {
		gypOpts.push("--release",)
	}

	if (verbose) {
		gypOpts.push("--verbose")
		console.log("Called with --verbose")
		console.log(`Calling gyp '${gypCommand}' using options: ${gypOpts}`)
	}

	// need "shell: true" to build on windows ...
	const spawnOptions = {stdio: "inherit", shell: true, cwd: modulePath}
	const invocation = ["node-gyp", gypCommand, ...gypOpts]

	console.log("running ", "\"" + invocation.join(" ") + "\"", "in", modulePath)

	const gyp = spawn(
		"npm exec",
		[
			"--",
			...invocation
		],
		spawnOptions
	)

	gyp.on('exit', code => {
		if (code === 0) {
			console.log('Compiled keytar successfully \n')
		} else {
			console.log('Compiling keytar failed \n')
			process.exit(1)
		}
	})
}

async function readElectronVersionFromPackageDotJson() {
	let electronVersion
	const packageDotJsonPath = path.join(__dirname, "../package.json")
	const packageDotJsonContents = await fs.readJson(packageDotJsonPath)
	electronVersion = packageDotJsonContents.devDependencies.electron
	electronVersion = electronVersion.replace(/[~^]/, "")
	return electronVersion;
}

/* Finds the directory where keytar is located. When building tutanota-3 by itself, this obviously is "node_modules/keytar".
   When building something that uses tutanota-3 as a dependency, however, we cannot rely on the tutanota-3 directory
   being used to download keytar into. npm might instead install it in the dependent's "node_modules" in order to optimize disk and
   bandwidth usage ("deduping").
 */
function findKeytarModuleDir() {
	const require = createRequire(import.meta.url);
	const pathName = require.resolve('keytar');
	const seperator = path.sep
	const pathFragments = pathName.split(seperator)
	const nodeModulesPathFragments = pathFragments.slice(0, pathFragments.lastIndexOf("node_modules") + 1)
	let keytarModuleDir
	// on unixoids prepend '/' to path, on windows don't
	if (process.platform === 'win32') {
		keytarModuleDir = path.join(...nodeModulesPathFragments, "keytar")
	} else {
		keytarModuleDir = path.join('/', ...nodeModulesPathFragments, "keytar")
	}
	return keytarModuleDir
}