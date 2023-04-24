import fs from "node:fs"
import path from "node:path"
import { getNativeLibModulePath } from "./nativeLibraryProvider.js"

/** copy either a fresh build or a cached version of a native module for the platform client being built into the build directory.*/
export function copyNativeModulePlugin({ rootDir, dstPath, platform, nodeModule }, log = console.log.bind(console)) {
	return {
		name: "copy-native-module-plugin",
		async buildStart() {
			const modulePath = await getNativeLibModulePath({
				nodeModule,
				environment: "electron",
				rootDir,
				log,
				platform,
				// for some reason, the binary produced by better-sqlite3 is called better_sqlite3.node
				copyTarget: nodeModule.replace("-", "_"),
			})
			const normalDst = path.join(path.normalize(dstPath), `${nodeModule}.node`)
			const dstDir = path.dirname(normalDst)
			await fs.promises.mkdir(dstDir, { recursive: true })
			await fs.promises.copyFile(modulePath, normalDst)
		},
	}
}

/**
 * Rollup plugin which injects paths to the native code libraries.
 *
 * we're using some self-built native node modules, namely keytar and better-sqlite3.
 * these need to be bundled into the client.
 * keytar and better-sqlite3 have different ways of getting their native module loaded:
 * - keytar requires it directly
 * - better-sqlite3 exports a class whose constructor takes a path to the native module which is then required dynamically.
 *
 * this requires us to use different strategies for injecting the right path into the build process.
 *
 * See DesktopMain.
 */
export function nativeBannerPlugin(nativeBindingPaths, log = console.log.bind(console)) {
	const sqlPath = nativeBindingPaths["better-sqlite3"]
	const keytarPath = nativeBindingPaths["keytar"]
	return {
		name: "native-banner-plugin",
		async resolveId(source) {
			if (source.includes("keytar.node")) return { id: keytarPath, external: true }
		},
		banner() {
			return `
			globalThis.buildOptions = globalThis.buildOptions ?? {}
			globalThis.buildOptions.sqliteNativePath = "${sqlPath}";
			`
		},
	}
}
