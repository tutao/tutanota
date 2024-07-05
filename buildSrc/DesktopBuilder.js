import { resolveLibs } from "./RollupConfig.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import fs from "node:fs"
import path, { dirname } from "node:path"
import { rollup } from "rollup"
import terser from "@rollup/plugin-terser"
import electronBuilder from "electron-builder"
import generatePackageJson from "./electron-package-json-template.js"
import { create as createEnv, preludeEnvPlugin } from "./env.js"
import cp from "node:child_process"
import util from "node:util"
import typescript from "@rollup/plugin-typescript"
import { copyNativeModulePlugin, nativeBannerPlugin } from "./nativeLibraryRollupPlugin.js"
import { fileURLToPath } from "node:url"
import { getCanonicalPlatformName } from "./buildUtils.js"
import { domainConfigs } from "./DomainConfigs.js"
import commonjs from "@rollup/plugin-commonjs"

const exec = util.promisify(cp.exec)
const buildSrc = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.join(buildSrc, ".."))

/**
 * @param dirname directory this was called from
 * @param version application version that gets built
 * @param platform: {"linux"|"win32"|"darwin"} - Canonical platform name of the desktop target to be built
 * @param architecture: {"arm64"|"x64"|"universal"} the instruction set used in the built desktop binary
 * @param updateUrl where the client should pull its updates from, if any
 * @param nameSuffix suffix used to distinguish test-, prod- or snapshot builds on the same machine
 * @param notarize for the MacOs notarization feature
 * @param outDir where copy the finished artifacts
 * @param unpacked output desktop client without packing it into an installer
 * @returns {Promise<void>}
 */
export async function buildDesktop({ dirname, version, platform, architecture, updateUrl, nameSuffix, notarize, outDir, unpacked, disableMinify }) {
	// The idea is that we
	// - build desktop code into build/desktop
	// - package the whole dist directory into the app
	// - move installers out of the dist into build/desktop-whatever
	// - cleanup dist directory
	// It's messy

	console.log(`Building ${architecture} ${platform} desktop client for v${version}`)
	updateUrl = updateUrl?.toString()
	const updateSubDir = `desktop${nameSuffix}`
	const distDir = path.join(dirname, "build")

	// this prevents us from outputting artifacts into the "desktop" build folder that contains the desktop clients js files that get bundled
	outDir = path.join(outDir ?? distDir, "..", "artifacts", updateSubDir)
	await fs.promises.rm(outDir, { recursive: true, force: true })
	await fs.promises.mkdir(outDir, { recursive: true })

	// We need to get the right build of native dependencies. There's a tool called node-gyp which can build for different architectures
	// and downloads everything it needs. Usually dependencies build themselves in post-install script.
	// Currently we have sqlite which avoids building itself if possible and only build
	console.log("Updating electron-builder config...")
	const content = await generatePackageJson({
		nameSuffix,
		version,
		updateUrl,
		iconPath: path.join(dirname, "/resources/desktop-icons/logo-solo-red.png" + (platform === "win32" ? ".ico" : "")),
		notarize,
		unpacked,
		sign: (process.env.DEBUG_SIGN && updateUrl !== "") || !!process.env.JENKINS_HOME,
		architecture,
	})
	console.log("updateUrl is", updateUrl)
	await fs.promises.writeFile("./build/package.json", JSON.stringify(content), "utf-8")
	if (platform === "win32") await getMapirs(distDir)

	// prepare files
	try {
		await fs.promises.rm(path.join(distDir, updateSubDir), { recursive: true })
	} catch (e) {
		if (e.code !== "ENOENT") {
			throw e
		}
	}

	console.log("Bundling desktop client")
	await rollupDesktop(dirname, path.join(distDir, "desktop"), version, platform, architecture, disableMinify)

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
		// @ts-ignore this is the argument to the cli but it's not in ts types?
		_: ["build"],
		win: platform === "win32" ? [] : undefined,
		mac: platform === "darwin" ? [] : undefined,
		linux: platform === "linux" ? [] : undefined,
		publish: "always",
		project: distDir,
	})
	console.log("Move output to ", outDir)
	await Promise.all(
		fs
			.readdirSync(path.join(distDir, "/installers"))
			.filter((file) => file.startsWith(content.name) || file.endsWith(".yml") || file.endsWith("-unpacked"))
			.map((file) => fs.promises.rename(path.join(distDir, "/installers/", file), path.join(outDir, file))),
	)
	await Promise.all([
		fs.promises.rm(path.join(distDir, "/installers/"), { recursive: true, force: true }),
		fs.promises.rm(path.join(distDir, "/node_modules/"), { recursive: true, force: true }),
		fs.promises.unlink(path.join(distDir, "/package.json")),
		fs.promises.unlink(path.join(distDir, "/package-lock.json")),
	])
}

async function rollupDesktop(dirname, outDir, version, platform, architecture, disableMinify) {
	platform = getCanonicalPlatformName(platform)
	const mainBundle = await rollup({
		input: [path.join(dirname, "src/common/desktop/DesktopMain.ts"), path.join(dirname, "src/common/desktop/sqlworker.ts")],
		// some transitive dep of a transitive dev-dep requires https://www.npmjs.com/package/url
		// which rollup for some reason won't distinguish from the node builtin.
		external: ["url", "util", "path", "fs", "os", "http", "https", "crypto", "child_process", "electron"],
		preserveEntrySignatures: false,
		plugins: [
			copyNativeModulePlugin({
				rootDir: projectRoot,
				dstPath: "./build/desktop/",
				platform,
				architecture,
				nodeModule: "better-sqlite3",
			}),
			typescript({
				tsconfig: "tsconfig.json",
				outDir,
			}),
			resolveLibs(),
			nodeResolve({
				preferBuiltins: true,
				resolveOnly: [/^@tutao\/.*$/],
			}),
			commonjs(),
			disableMinify ? undefined : terser(),
			preludeEnvPlugin(createEnv({ staticUrl: null, version, mode: "Desktop", dist: true, domainConfigs })),
			nativeBannerPlugin({
				// Relative to the source file from which the .node file is loaded.
				// In our case it will be desktop/DesktopMain.js, which is located in the same directory.
				// This depends on the changes we made in our own fork of better_sqlite3.
				// It's okay to use forward slash here, it is passed to require which can deal with it.
				"better-sqlite3": "./better-sqlite3.node",
			}),
		],
	})
	await mainBundle.write({ sourcemap: true, format: "commonjs", dir: outDir })
	await fs.promises.copyFile(path.join(dirname, "src/common/desktop/preload.js"), path.join(outDir, "preload.js"))
	await fs.promises.copyFile(path.join(dirname, "src/common/desktop/preload-webdialog.js"), path.join(outDir, "preload-webdialog.js"))
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
	const dllSrc =
		process.platform === "win32"
			? path.join("../mapirs/target/x86_64-pc-windows-msvc/release", dllName)
			: path.join("../mapirs/target/x86_64-pc-windows-gnu/release", dllName)
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
	try {
		const { Octokit } = await import("@octokit/rest")
		const octokit = new Octokit()
		const opts = {
			owner: "tutao",
			repo: "mapirs",
		}
		console.log("getting latest mapirs release")
		const res = await octokit.request("GET /repos/{owner}/{repo}/releases/latest", opts)
		console.log("latest mapirs release", res.url)
		const asset_id = res.data.assets.find((a) => a.name.startsWith(dllName)).id
		console.log("Downloading mapirs asset", asset_id)
		const assetResponse = await octokit.repos.getReleaseAsset({
			...opts,
			asset_id,
			headers: {
				Accept: "application/octet-stream",
			},
		})
		console.log("Writing mapirs asset")
		// @ts-ignore not clear how to check for response status so that ts is happy
		await fs.promises.writeFile(dllTrg, Buffer.from(assetResponse.data))
		console.log("Mapirs downloaded")
	} catch (e) {
		console.error("Failed to download mapirs!", e)
		throw e
	}
}
