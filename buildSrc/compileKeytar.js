import {spawn} from "child_process"
import fs from "fs-extra"
import options from "commander"
import path, {dirname} from "path"
import {fileURLToPath} from "url"
import { createRequire } from 'module';


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

buildElectron(opts)

async function buildElectron(opts) {
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
		`--directory=${modulePath}`,
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

	const spawnOptions = {stdio: "inherit"}
	const gyp = spawn(
		'node-gyp',
		[
			gypCommand,
			...gypOpts
		],
		spawnOptions
	)

	gyp.on('exit', code => {
		if (code === 0) {
			console.log('Compiled keytar successfully \n')
		} else {
			console.log('Compiling keytar failed \n')
		}
	})
}

async function readElectronVersionFromPackageDotJson() {
	let electronVersion
	const packageDotJsonPath = path.join(__dirname, "../package.json")
	const packageDotJsonContents = await fs.readJson(packageDotJsonPath)
	electronVersion = packageDotJsonContents.devDependencies.electron
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
	const keytarModuleDir = path.join("/", ...nodeModulesPathFragments, "keytar")
	return keytarModuleDir

}