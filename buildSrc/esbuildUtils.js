import { getNativeLibModulePath } from "./nativeLibraryProvider.js"
import fs from "fs-extra"
import path from "node:path"
import { dependencyMap } from "./RollupConfig.js"
import { aliasPath as esbuildPluginAliasPath } from "esbuild-plugin-alias-path"

/**
 * Little plugin that obtains compiled keytar, copies it to dstPath and sets the path to nativeBindingPath.
 * We do not use default file loader from esbuild, it is much simpler and reliable to do it manually.
 */
export function keytarNativePlugin({ environment, dstPath, nativeBindingPath, platform }) {
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
				await fs.promises.mkdir(path.dirname(dstPath), { recursive: true })
				await fs.promises.copyFile(modulePath, dstPath)
			})

			build.onResolve({ filter: /.*keytar.*\.node/, namespace: "file" }, (args) => {
				return {
					path: nativeBindingPath,
					external: true,
				}
			})
		},
	}
}

/**
 * Little plugin that obtains compiled better-sqlite3, copies it to dstPath and sets the path to nativeBindingPath.
 * We do not use default file loader from esbuild, it is much simpler and reliable to do it manually and it doesn't work for dynamic import (like in this case)
 * anyway.
 * It will also replace `buildOptions.sqliteNativePath` with the nativeBindingPath
 */
export function sqliteNativePlugin({ environment, dstPath, nativeBindingPath, platform }) {
	return {
		name: "sqlite-native-plugin",
		setup(build) {
			const options = build.initialOptions
			options.define = options.define ?? {}
			const nativeLibPath = nativeBindingPath ?? dstPath
			// Replace mentions of buildOptions.sqliteNativePath with the actual path
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
				await fs.promises.mkdir(path.dirname(dstPath), { recursive: true })
				await fs.promises.copyFile(modulePath, dstPath)
			})
		},
	}
}

/** Little plugin that replaces imports for libs from dependencyMap with their prebuilt versions in libs directory. */
export function libDeps(prefix = ".") {
	const absoluteDependencyMap = Object.fromEntries(
		Object.entries(dependencyMap).map(([k, v]) => {
			return [k, path.resolve(prefix, v)]
		}),
	)

	return esbuildPluginAliasPath({
		alias: absoluteDependencyMap,
	})
}

/** Little plugin that prepends env */
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
			// We do a few tricks here
			build.onResolve({ filter: /^\.\.\/translations\/.+$/, namespace: "file" }, ({ path }) => {
				// We replace all the translation imports (they all start with .. but we could rewrite it more generally at the cost of complexity
				// We should go from ../translations/en.js to ./translations/en.mjs
				// Out output structure is always flat (except for desktop which is it's own flat structure) so we know that we can find translations in the
				// ./translations
				// We marked them as external because we don't want esbuild to roll them up, it makes output *huge*
				// We add .mjs suffix so that we can import it from Electron without issues (more on that below). This is not necessary for of web but doesn't
				// hurt either.
				const replacementPath = path.substring(1).replace(".js", ".mjs")
				return {
					path: replacementPath,
					external: true,
				}
			})
			build.onEnd(async () => {
				// After the main build is done we go and compile all translations. Alternatively we could collect all imports from onResolve().
				const translations = await globby("src/translations/*.ts")
				await build.esbuild.build({
					// Always esm, even though desktop is compiled to commonjs because translations do `export default` and esbuild doesn't pick the correct
					// interop.
					// see https://esbuild.github.io/content-types/#default-interop
					format: "esm",
					outdir: build.initialOptions.outdir,
					entryPoints: translations,
					// Rename it to .mjs for reasons mentioned above
					outExtension: { [".js"]: ".mjs" },
					// So that it outputs build/translations/de.js instead of build/de.js
					// (or build/desktop/translations/de.js instead of build/desktop/de.js)
					outbase: "src",
				})
			})
		},
	}
}
