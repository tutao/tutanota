import fs from "fs"
import path from "path"
import {getNativeLibModulePath} from "./nativeLibraryProvider.js"

/**
 * Rollup plugin which injects path to better-sqlite3 native code.
 * See DesktopMain.
 */
export function sqliteNativeBannerPlugin(
	{environment, rootDir, dstPath, platform},
	log = console.log.bind(console)
) {
	return {
		name: "sqlite-native-banner-plugin",
		async buildStart() {
			const modulePath = await getNativeLibModulePath({
				nodeModule: "better-sqlite3",
				environment,
				rootDir,
				log,
				platform,
				copyTarget: "better_sqlite3",
			})
			await fs.promises.mkdir(path.dirname(dstPath), {recursive: true})
			await fs.promises.copyFile(modulePath, dstPath)
		},
		banner() {
			return `
			globalThis.buildOptions = globalThis.buildOptions ?? {}
			globalThis.buildOptions.sqliteNativePath = "${dstPath}";
			`
		}
	}
}

/**
 * Rollup plugin which injects path to better-sqlite3 native code.
 * See DesktopMain.
 */
export function keytarNativePlugin(
	{rootDir, platform},
	log = console.log.bind(console)
) {
	let outputPath
	return {
		name: "keytar-native-banner-plugin",
		async buildStart() {

			outputPath = await getNativeLibModulePath({
				nodeModule: "keytar",
				environment: "electron",
				rootDir,
				log,
				platform,
			})
			// await fs.promises.mkdir(path.dirname(dstPath), {recursive: true})
			// await fs.promises.copyFile(modulePath, dstPath)
		},
		resolveId(id) {
			if (id.endsWith("keytar.node")) {
				if (outputPath == null) {
					throw new Error("Something didn't quite work")
				}
				return outputPath
			}
		},
		async load(id) {
			if (id === outputPath) {
				const name = path.basename(id)
				const content = await fs.promises.readFile(id)
				this.emitFile({
					type: 'asset',
					name,
					fileName: name,
					source: content,
				})
				return `
				const nativeModule = require('./${name}')
				export default nativeModule`
			}
		},
	}
}

