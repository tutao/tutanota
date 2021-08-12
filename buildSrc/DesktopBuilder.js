import {babelDesktopPlugins, resolveLibs} from "./RollupConfig.js"
import {nativeDepWorkaroundPlugin, pluginNativeLoader} from "./RollupPlugins.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import fs from "fs"
import path from "path"
import {rollup} from "rollup"
import {terser} from "rollup-plugin-terser"
import pluginBabel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import electronBuilder from "electron-builder"
import generatePackgeJson from "./electron-package-json-template.js"
import {create as createEnv, preludeEnvPlugin} from "./env.js"
import cp from 'child_process'
import util from 'util'

const {babel} = pluginBabel
const exec = util.promisify(cp.exec)

export async function buildDesktop({
	                                   dirname, // directory this was called from
	                                   version, // application version that gets built
	                                   targets, // which desktop targets to build and how to package them
	                                   updateUrl, // where the client should pull its updates from, if any
	                                   nameSuffix, // suffix used to distinguish test-, prod- or snapshot builds on the same machine
	                                   notarize, // for the MacOs notarization feature
	                                   outDir, // where copy the finished artifacts
	                                   unpacked, // output desktop client without packing it into an installer
                                   }) {
	// The idea is that we
	// - build desktop code into build/dist/desktop
	// - package the whole dist directory into the app
	// - move installers out of the dist into build/desktop-whatever
	// - cleanup dist directory
	// It's messy
	const targetString = Object.keys(targets)
	                           .filter(k => typeof targets[k] !== "undefined")
	                           .join(" ")
	console.log("Building desktop client for v" + version + " (" + targetString + ")...")
	const updateSubDir = "desktop" + nameSuffix
	const distDir = path.join(dirname, "build", "dist")
	outDir = path.join(outDir || path.join(distDir, ".."), updateSubDir)
	await fs.promises.mkdir(outDir, {recursive: true})


	// We need to get the right build of native dependencies. There's a tool called node-gyp which can build for different architectures
	// and downloads everything it needs. Usually dependencies build themselves in post-install script.
	// Currently we have keytar which avoids building itself if possible and only build
	console.log("Updating electron-builder config...")
	const content = generatePackgeJson({
		nameSuffix,
		version,
		updateUrl,
		iconPath: path.join(dirname, "/resources/desktop-icons/logo-solo-red.png"),
		notarize,
		unpacked,
		sign: (process.env.DEBUG_SIGN && updateUrl !== "") || !!process.env.JENKINS,
	})
	console.log("updateUrl is", updateUrl)
	await fs.promises.writeFile("./build/dist/package.json", JSON.stringify(content), 'utf-8')
	if (targets["win32"] != null) {
		await fs.promises.copyFile('../mapirs/target/x86_64-pc-windows-gnu/release/mapirs.dll', './build/dist/mapirs.dll')
	}

	await maybeGetKeytar(targets)

	// prepare files
	try {
		await fs.promises.rm(path.join(distDir, "..", updateSubDir), {recursive: true})
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e
		}
	}
	console.log("Bundling desktop client")
	await rollupDesktop(dirname, path.join(distDir, "desktop"), version)

	console.log("Starting installer build...")
	if (process.platform.startsWith("darwin")) {
		// dmg-license is required by electron to build the mac installer
		// We can't put dmg-license as a dependency in package.json because
		// it will cause npm install to fail if you do it in linux or windows
		// We could install it in mac and then it will be in package-lock.json
		// but then we will have to be vigilant that it doesn't get removed ever
		await exec("npm install dmg-license")
	}

	// package for linux, win, mac
	await electronBuilder.build({
		_: ['build'],
		win: targets.win32,
		mac: targets.mac,
		linux: targets.linux,
		publish: 'always',
		project: distDir
	})
	console.log("Move output to ", outDir)
	await fs.promises.mkdir(outDir, {recursive: true})
	await Promise.all(
		fs.readdirSync(path.join(distDir, '/installers'))
		  .filter((file => file.startsWith(content.name) || file.endsWith('.yml') || file.endsWith("-unpacked")))
		  .map(file => fs.promises.rename(
			  path.join(distDir, '/installers/', file),
			  path.join(outDir, file)
			  )
		  )
	)
	await Promise.all([
		fs.promises.rm(path.join(distDir, '/installers/'), {recursive: true}),
		fs.promises.rm(path.join(distDir, '/node_modules/'), {recursive: true}),
		fs.promises.unlink(path.join(distDir, '/package.json')),
		fs.promises.unlink(path.join(distDir, '/package-lock.json'),),
	])
}

async function rollupDesktop(dirname, outDir, version) {
	function babelPreset() {
		return babel({
			plugins: babelDesktopPlugins,
			babelHelpers: "bundled",
		})
	}

	const mainBundle = await rollup({
		input: path.join(dirname, "src/desktop/DesktopMain.js"),
		preserveEntrySignatures: false,
		plugins: [
			babelPreset(),
			resolveLibs(),
			nativeDepWorkaroundPlugin(),
			pluginNativeLoader(),
			nodeResolve({preferBuiltins: true}),
			// requireReturnsDefault: "preferred" is needed in order to correclty generate a wrapper for the native keytar module
			commonjs({
				exclude: "src/**",
				requireReturnsDefault: "preferred",
			}),
			terser(),
			preludeEnvPlugin(createEnv(null, version, "Desktop", true))
		]
	})
	await mainBundle.write({sourcemap: true, format: "commonjs", dir: outDir})
	await fs.promises.copyFile(path.join(dirname, "src/desktop/preload.js"), path.join(outDir, "preload.js"))
}

/**
 * we can't cross-compile keytar, so we need to have the prebuilt version
 * when building a desktop client for windows on linux
 *
 * napiVersion is the N-API version that's used by keytar.
 * the current release artifacts on github are namend accordingly,
 * e.g. keytar-v7.7.0-napi-v3-linux-x64.tar.gz for N-API v3
 */
async function maybeGetKeytar(targets, napiVersion = 3) {
	const trg = Object.keys(targets)
	                  .filter(t => targets[t] != null)
	                  .filter(t => t !== process.platform)
	if (trg.length === 0 || process.env.JENKINS) return
	console.log("fetching prebuilt keytar for", trg, "N-API", napiVersion)
	return Promise.all(trg.map(t => exec(
		`prebuild-install --platform ${t} --target ${napiVersion} --tag-prefix v --runtime napi --verbose`,
		{
			cwd: './node_modules/keytar/',
			stdout: 'inherit'
		}
	)))
}