import {resolveLibs} from "./RollupConfig.js"
import {nativeDepWorkaroundPlugin} from "./Builder.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import Promise from "bluebird"
import fs from "fs"
import path from "path"
import {rollup} from "rollup"
import {terser} from "rollup-plugin-terser"
import pluginBabel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import electronBuilder from "electron-builder"
import generatePackgeJson from "./electron-package-json-template.js"
import {create as createEnv, preludeEnvPlugin} from "./env.js"

const {babel} = pluginBabel


export async function buildDesktop({
	                                   dirname, // directory this was called from
	                                   version, // application version that gets built
	                                   targets, // which desktop targets to build and how to package them
	                                   updateUrl, // where the client should pull its updates from, if any
	                                   nameSuffix, // suffix used to distinguish test-, prod- or snapshot builds on the same machine
	                                   notarize, // for the MacOs notarization feature
	                                   outDir, // where copy the finished artifacts
	                                   unpacked // output desktop client without packing it into an installer
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
	// prepare files
	try {
		await fs.promises.rmdir(path.join(distDir, "..", updateSubDir), {recursive: true})
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e
		}
	}
	console.log("Bundling desktop client")
	await rollupDesktop(dirname, path.join(distDir, "desktop"), version)

	console.log("Starting installer build...")
	// package for linux, win, mac
	await electronBuilder.build({
		_: ['build'],
		win: targets.win,
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
		fs.promises.rmdir(path.join(distDir, '/installers/'), {recursive: true}),
		fs.promises.rmdir(path.join(distDir, '/node_modules/'), {recursive: true}),
		fs.promises.unlink(path.join(distDir, '/package.json')),
		fs.promises.unlink(path.join(distDir, '/package-lock.json'),),
	])
}

async function rollupDesktop(dirname, outDir, version) {
	function babelPreset() {
		return babel({
			plugins: [
				// Using Flow plugin and not preset to run before class-properties and avoid generating strange property code
				"@babel/plugin-transform-flow-strip-types",
				"@babel/plugin-proposal-class-properties",
				"@babel/plugin-syntax-dynamic-import",
			],
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
			resolveKeytarPlugin(),
			nodeResolve({preferBuiltins: true}),
			commonjs({exclude: "src/**"}),
			terser(),
			preludeEnvPlugin(createEnv(null, version, "Desktop", true))
		]
	})
	await mainBundle.write({sourcemap: true, format: "commonjs", dir: outDir})
	await fs.promises.copyFile(path.join(dirname, "src/desktop/preload.js"), path.join(outDir, "preload.js"))
}

function resolveKeytarPlugin() {
	return {
		name: "resolve-keytar",
		resolveId(id) {
			// These are packaged as-is in node_modules
			if (id === "keytar") {
				return false
			}
		}
	}
}