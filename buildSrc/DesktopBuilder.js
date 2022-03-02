import {resolveLibs} from "./RollupConfig.js"
import {nativeDepWorkaroundPlugin} from "./RollupPlugins.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import fs from "fs"
import path, {dirname} from "path"
import {rollup} from "rollup"
import {terser} from "rollup-plugin-terser"
import commonjs from "@rollup/plugin-commonjs"
import electronBuilder from "electron-builder"
import generatePackageJson from "./electron-package-json-template.js"
import {create as createEnv, preludeEnvPlugin} from "./env.js"
import cp from 'child_process'
import util from 'util'
import typescript from "@rollup/plugin-typescript"
import {keytarNativePlugin, sqliteNativeBannerPlugin} from "./nativeLibraryRollupPlugin.js"
import {fileURLToPath} from "url"

const exec = util.promisify(cp.exec)
const buildSrc = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.join(buildSrc, ".."))

/**
 * @param dirname directory this was called from
 * @param version application version that gets built
 * @param platform: {"linux"|"win32"|"darwin"} - Canonical platform name of the desktop target to be built
 * @param updateUrl where the client should pull its updates from, if any
 * @param nameSuffix suffix used to distinguish test-, prod- or snapshot builds on the same machine
 * @param notarize for the MacOs notarization feature
 * @param outDir where copy the finished artifacts
 * @param unpacked output desktop client without packing it into an installer
 * @returns {Promise<void>}
 */
export async function buildDesktop(
	{
		dirname,
		version,
		platform,
		updateUrl,
		nameSuffix,
		notarize,
		outDir,
		unpacked,
	}
) {
	// The idea is that we
	// - build desktop code into build/dist/desktop
	// - package the whole dist directory into the app
	// - move installers out of the dist into build/desktop-whatever
	// - cleanup dist directory
	// It's messy

	console.log(`Building ${platform} desktop client for v${version}`)
	const updateSubDir = `desktop${nameSuffix}`
	const distDir = path.join(dirname, "build", "dist")
	outDir = path.join(outDir ?? path.join(distDir, ".."), updateSubDir)
	await fs.promises.mkdir(outDir, {recursive: true})


	// We need to get the right build of native dependencies. There's a tool called node-gyp which can build for different architectures
	// and downloads everything it needs. Usually dependencies build themselves in post-install script.
	// Currently we have keytar which avoids building itself if possible and only build
	console.log("Updating electron-builder config...")
	const content = generatePackageJson({
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
	if (platform === "win32") await getMapirs(distDir)

	// prepare files
	try {
		await fs.promises.rm(path.join(distDir, "..", updateSubDir), {recursive: true})
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e
		}
	}

	console.log("Bundling desktop client")
	await rollupDesktop(dirname, path.join(distDir, "desktop"), version, platform)

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
		win: platform === "win32" ? [] : undefined,
		mac: platform === "darwin" ? [] : undefined,
		linux: platform === "linux" ? [] : undefined,
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

async function rollupDesktop(dirname, outDir, version, platform) {
	const mainBundle = await rollup({
		input: path.join(dirname, "src/desktop/DesktopMain.ts"),
		preserveEntrySignatures: false,
		plugins: [
			typescript({
				tsconfig: "tsconfig.json",
				outDir,
			}),
			resolveLibs(),
			nativeDepWorkaroundPlugin(),
			keytarNativePlugin({
				rootDir: projectRoot,
				platform
			}),
			nodeResolve({preferBuiltins: true}),
			// requireReturnsDefault: "preferred" is needed in order to correclty generate a wrapper for the native keytar module
			commonjs({
				exclude: "src/**",
				requireReturnsDefault: "preferred",
				ignoreDynamicRequires: true,
			}),
			terser(),
			preludeEnvPlugin(createEnv({staticUrl: null, version, mode: "Desktop", dist: true})),
			sqliteNativeBannerPlugin(
				{
					environment: "electron",
					rootDir: projectRoot,
					dstPath: "./build/dist/desktop/better_sqlite3.node",
					platform,
				}
			),
		]
	})
	await mainBundle.write({sourcemap: true, format: "commonjs", dir: outDir})
	await fs.promises.copyFile(path.join(dirname, "src/desktop/preload.js"), path.join(outDir, "preload.js"))
	await fs.promises.copyFile(path.join(dirname, "src/desktop/preload-webdialog.js"), path.join(outDir, "preload-webdialog.js"))
}


/**
 * get the DLL that's needed for the windows client to handle "Send as Mail..." context
 * menu actions.
 * Tries to get a locally built version before delegating to downloadLatestMapirs
 * @param distDir the directory to put the DLL
 * @returns {Promise<void>}
 */
async function getMapirs(distDir) {
	const dllName = "mapirs.dll"
	const dllSrc = process.platform === "win32"
		? path.join('../mapirs/target/x86_64-pc-windows-msvc/release', dllName)
		: path.join('../mapirs/target/x86_64-pc-windows-gnu/release', dllName)
	const dllTrg = path.join(distDir, dllName)
	console.log("trying to copy", dllName, "from", dllSrc, "to", dllTrg)
	try {
		await fs.promises.copyFile(dllSrc, dllTrg)
	} catch (e) {
		console.log("no local", dllName, "found, using release from github")
		await downloadLatestMapirs(dllName, dllTrg)
	}
}

/**
 * get the latest mapirs.dll release from github.
 * @param dllName {string} name of the file that should be downloaded from the latest release
 * @param dllTrg {string} path to put the downloaded file
 * @returns {Promise<void>}
 */
async function downloadLatestMapirs(dllName, dllTrg) {
	const {Octokit} = await import("@octokit/rest")
	const octokit = new Octokit();
	const opts = {
		owner: "tutao",
		repo: "mapirs"
	}
	const res = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', opts)
	const asset_id = res.data.assets.find(a => a.name.startsWith(dllName)).id
	const asset = await octokit.repos.getReleaseAsset(Object.assign(opts, {
		asset_id,
		headers: {
			"Accept": "application/octet-stream"
		}
	}))

	await fs.promises.writeFile(dllTrg, Buffer.from(asset.data))
}