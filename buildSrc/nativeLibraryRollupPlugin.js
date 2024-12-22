import fs from "node:fs"
import path from "node:path"
import { getNativeLibModulePaths } from "./nativeLibraryProvider.js"
import { normalizeCopyTarget, removeNpmNamespacePrefix } from "./buildUtils.js"

/** copy either a fresh build or a cached version of a native module for the platform client being built into the build directory.*/
export function copyNativeModulePlugin({ rootDir, dstPath, platform, architecture, nodeModule }, log = console.log.bind(console)) {
	return {
		name: "copy-native-module-plugin",
		async buildStart() {
			const modulePaths = await getNativeLibModulePaths({
				nodeModule,
				environment: "electron",
				rootDir,
				log,
				platform,
				architecture,
				copyTarget: normalizeCopyTarget(nodeModule),
			})
			for (let [architecture, modulePath] of Object.entries(modulePaths)) {
				if (nodeModule === "@tutao/node-mimimi") {
					architecture = getMimimiArchitecture(platform, architecture)
				}
				const normalDst = path.join(path.normalize(dstPath), `${removeNpmNamespacePrefix(nodeModule)}.${platform}-${architecture}.node`)
				const dstDir = path.dirname(normalDst)
				await fs.promises.mkdir(dstDir, { recursive: true })
				await fs.promises.copyFile(modulePath, normalDst)
			}
		},
	}
}

/**
 * napi appends abi to the architecture (see https://napi.rs/docs/cli/napi-config)
 */
function getMimimiArchitecture(platform, architecture) {
	if (platform === "linux") {
		return architecture + "-gnu"
	} else if (platform === "win32") {
		return architecture + "-msvc"
	}
	return architecture
}

/**
 * Rollup plugin which injects paths to the native code libraries.
 *
 * we're using some self-built native node modules, namely better-sqlite3.
 * these need to be bundled into the client.
 * better-sqlite3 has a way of getting its native module loaded:
 * it exports a class whose constructor takes a path to the native module which is then required dynamically.
 *
 * See DesktopMain.
 */
export function nativeSqlBannerPlugin(log = console.log.bind(console)) {
	// th path is Relative to the source file from which the .node file is loaded.
	// In our case it will be desktop/DesktopMain.js, which is located in the same directory.
	// This depends on the changes we made in our own fork of better_sqlite3.
	// It's okay to use forward slash here, it is passed to require which can deal with it.
	return {
		name: "native-banner-plugin",
		banner() {
			return `
			globalThis.buildOptions = globalThis.buildOptions ?? {}
			globalThis.buildOptions.sqliteNativePath = process.arch === "arm64"
				? "./better-sqlite3." + process.platform + "-arm64.node"
				: "./better-sqlite3." + process.platform + "-x64.node";
			`
		},
	}
}
