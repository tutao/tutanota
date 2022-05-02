import {getNativeLibModulePath} from "./nativeLibraryProvider.js"
import fs from "fs-extra"
import path from "path"

/**
 * Little plugin that obtains compiled keytar, copies it to dstPath and sets the path to nativeBindingPath.
 * We do not use default file loader from esbuild, it is much simpler and reliable to do it manually.
 */
export function keytarNativePlugin(
	{environment, dstPath, nativeBindingPath, platform}
) {
	return {
		name: "keytar-native-plugin",
		setup(build) {
			build.onStart(async () => {
				const modulePath = await getNativeLibModulePath({
					nodeModule: "keytar",
					environment,
					rootDir: process.cwd(),
					log: console.log.bind(console),
					platform,
					copyTarget: "keytar",
				})
				await fs.promises.mkdir(path.dirname(dstPath), {recursive: true})
				await fs.promises.copyFile(modulePath, dstPath)
			})

			build.onResolve({filter: /.*keytar.*\.node/, namespace: 'file'}, (args) => {
				return {
					path: nativeBindingPath,
					external: true,
				}
			})
		}
	}
}

/**
 * Little plugin that obtains compiled better-sqlite3, copies it to dstPath and sets the path to nativeBindingPath.
 * We do not use default file loader from esbuild, it is much simpler and reliable to do it manually and it doesn't work for dynamic import (like in this case)
 * anyway.
 * It will also replace `buildOptions.sqliteNativePath` with the nativeBindingPath
 */
export function sqliteNativePlugin(
	{environment, dstPath, nativeBindingPath, platform}
) {
	return {
		name: "sqlite-native-plugin",
		setup(build) {
			const options = build.initialOptions
			options.define = options.define ?? {}
			const nativeLibPath = (nativeBindingPath ?? dstPath)
			options.define["buildOptions.sqliteNativePath"] = `"${nativeLibPath}"`

			build.onStart(async () => {
				const modulePath = await getNativeLibModulePath({
					nodeModule: "better-sqlite3",
					environment,
					rootDir: process.cwd(),
					log: console.log.bind(console),
					platform,
					copyTarget: "better_sqlite3",
				})
				await fs.promises.mkdir(path.dirname(dstPath), {recursive: true})
				await fs.promises.copyFile(modulePath, dstPath)
			})
		},
	}
}


