import {getNativeLibModulePath} from "./nativeLibraryProvider.js"
import fs from "fs-extra"
import path from "path"
import {dependencyMap} from "./RollupConfig.js"
import {esbuildPluginAliasPath} from "esbuild-plugin-alias-path"

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

export function libDeps(prefix = ".") {
	const absoluteDependencyMap = Object.fromEntries(
		Object.entries(dependencyMap)
			  .map(
				  (([k, v]) => {
					  return [k, path.resolve(prefix, v)]
				  })
			  )
	)

	return esbuildPluginAliasPath({
		alias: absoluteDependencyMap,
	})
}

export function preludeEnvPlugin(env) {
	return {
		name: "prelude-env",
		setup(build) {
			const options = build.initialOptions
			options.banner = options.banner ?? {}
			const bannerStart = options.banner["js"] ? options.banner["js"] + "\n" : ""
			options.banner["js"] = bannerStart + `globalThis.env = ${JSON.stringify(env, null, 2)};`
		},
	}
}

/** Do not embed translations in the source, compile them separately so that ouput is not as huge. */
export function externalTranslationsPlugin() {
	return {
		name: "skip-translations",
		setup(build) {
			build.onResolve({filter: /\.\.\/translations\/.+/, namespace: "file"}, () => {
				return {
					external: true,
				}
			})
			build.onEnd(async () => {
				const translations = await globby("src/translations/*.ts")
				await build.esbuild.build({
					...build.initialOptions,
					// No need for plugins there, also we don't want *this* plugin to be called again
					plugins: [],
					entryPoints: translations,
					// So that it outputs build/translations/de.js instead of build/de.js
					// (or build/desktop/translations/de.js instead of build/desktop/de.js)
					outbase: "src",
				})
			})
		}
	}
}