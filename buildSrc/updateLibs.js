/**
 * Copies all currently used libraries from node_modules into libs.
 *
 * We do this to be able to audit changes in the libraries and not rely on npm for checksums.
 */
import fs from "fs-extra"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { rollup } from "rollup"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import { $ } from "zx"

const __dirname = dirname(fileURLToPath(import.meta.url))

/*
 * Each entry is one of:
 *  - string: will be copied from specified to libs preserving the file name
 *  - object with:
 *     - src: path to file
 *     - target: resulting file name
 *     - rollup: if truthy will use src as input for rollup, otherwise just copy
 */
const clientDependencies = [
	"../node_modules/systemjs/dist/s.js",
	"../node_modules/mithril/mithril.js",
	"../node_modules/mithril/stream/stream.js",
	"../node_modules/squire-rte/dist/squire-raw.mjs",
	"../node_modules/dompurify/dist/purify.js",
	{ src: "../node_modules/linkifyjs/dist/linkify.es.js", target: "linkify.js" },
	{ src: "../node_modules/linkify-html/dist/linkify-html.es.js", target: "linkify-html.js" },
	"../node_modules/luxon/build/es6/luxon.js",
	{ src: "../node_modules/cborg/cborg.js", target: "cborg.js", rollup: true },
	{ src: "../node_modules/electron-updater/out/main.js", target: "electron-updater.mjs", rollup: rollDesktopDep },
	{ src: "../node_modules/better-sqlite3/lib/index.js", target: "better-sqlite3.mjs", rollup: rollDesktopDep },
	{ src: "../node_modules/winreg/lib/registry.js", target: "winreg.mjs", rollup: rollDesktopDep },
	{ src: "../node_modules/undici/index.js", target: "undici.mjs", rollup: rollDesktopDep },
]

run()

async function run() {
	// Try to parse the list of dependencies first, if there's any unmet dependency we abort the operation, so it can be fixed
	// before moving and replacing dependencies files.
	await updateVendoredVersionsFile()
	await copyToLibs(clientDependencies)
}

async function copyToLibs(files) {
	for (let srcFile of files) {
		let targetName = ""
		if (srcFile instanceof Object) {
			if (srcFile.rollup === true) {
				await rollWebDep(srcFile.src, srcFile.target)
				continue
			} else if (typeof srcFile.rollup === "function") {
				await srcFile.rollup(srcFile.src, srcFile.target)
				continue
			} else {
				targetName = srcFile.target
				srcFile = srcFile.src
			}
		} else {
			targetName = path.basename(srcFile)
		}
		await fs.copy(path.join(__dirname, srcFile), path.join(__dirname, "../libs/", targetName))
	}
}

/**
 * Extract packages version and replace unmet dependencies files by the correct ones
 * @return {Promise<void>}
 */
async function updateVendoredVersionsFile() {
	const names = clientDependencies
		.map((d) => (typeof d === "string" ? d : d.src))
		.map(path.normalize)
		.map((srcPath) => srcPath.split(path.sep)[2])

	// It's safe to allow NPM to fail here, since zx captures the errors, so we can handle it better latter
	// Also, if there's any mismatch file, NPM will return a non-zero exit code and add an error field to the response
	const runner = $
	runner.verbose = false

	// Don't return if any command fails and continue piping
	runner.prefix = "set -eu;"

	const { stdout, stderr } = await runner`npm list --json | sed -e 's/^{/'$(printf "\x1e")'{/' | jq .`
	const dependencyList = JSON.parse(stdout)

	if (dependencyList.error || stderr) {
		throw new Error(`[${dependencyList.error.code ?? "UNEXPECTED_ERROR"}] Failed to parse dependencies list. ${dependencyList.error.summary ?? stderr}`)
	}

	const result = {}
	for (let i = 0; i < names.length; i++) {
		const dependency = dependencyList.dependencies[names[i]]
		const useGit = dependency.resolved.startsWith("git")
		result[names[i]] = useGit ? convertGitSshToHttps(dependency.resolved) : dependency.version
	}
	fs.writeFileSync(path.join(__dirname, "../libs/", "vendored-versions.json"), JSON.stringify(result, null, 2))
}

/**
 * Converts git's url with ssh schema to use the https schema
 * @param sshUrl The url to have the schema changed
 * @return {String} A string containing the url with the HTTPS schema
 */
function convertGitSshToHttps(sshUrl) {
	// Remove the 'git@' prefix;
	// Replace 'git+ssh' with 'git+';
	// Replace '.git#' with "#"
	return sshUrl
		.replace(/git@/, "https://")
		.replace(/git\+ssh:\/\//, "git+")
		.replace(/(\.git#)/, "#")
}

/** Will bundle web app dependencies starting at {@param src} into a single file at {@param target}. */
async function rollWebDep(src, target) {
	const bundle = await rollup({ input: path.join(__dirname, src) })
	await bundle.write({ file: path.join(__dirname, "../libs", target) })
}

/**
 * rollup desktop dependencies with their dependencies into a single esm file
 *
 * specifically, electron-updater is importing some electron internals directly, so we made a comprehensive list of
 * exclusions to not roll up.
 */
async function rollDesktopDep(src, target) {
	const bundle = await rollup({
		input: path.join(__dirname, src),
		makeAbsoluteExternalsRelative: true,
		external: [
			// we handle .node imports ourselves
			/\.node$/,
			"assert",
			"child_process",
			"constants",
			"crypto",
			"electron",
			"events",
			"fs",
			"http",
			"https",
			"os",
			"path",
			"stream",
			"string_decoder",
			"tty",
			"url",
			"util",
			"zlib",
		],
		plugins: [
			nodeResolve({ preferBuiltins: true }),
			commonjs({
				// better-sqlite3 uses dynamic require to load the binary.
				// if there is ever another dependency that uses dynamic require
				// to load any javascript, we should revisit this and make sure
				// it's still correct.
				ignoreDynamicRequires: true,
			}),
		],
	})
	await bundle.write({ file: path.join(__dirname, "../libs", target), format: "es" })
}
