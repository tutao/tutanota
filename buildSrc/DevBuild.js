import path from "path"
import fs from "fs-extra"
import {prepareAssets} from "./Builder.js"
import {build} from "esbuild"
import {getTutanotaAppVersion} from "./buildUtils.js"
import {$} from "zx"
import "zx/globals"
import {keytarNativePlugin, sqliteNativePlugin} from "./nativeLibraryEsbuildPlugin.js"
import * as env from "./env.js"
import {dependencyMap} from "./RollupConfig.js"
import {esbuildPluginAliasPath} from "esbuild-plugin-alias-path"
import {runStep} from "./runStep.js"

export async function runDevBuild({stage, host, desktop, clean}) {
	if (clean) {
		await runStep("Clean", async () => {
			await fs.emptyDir("build")
		})
	}

	await runStep("Packages", async () => {
		await $`npm run build-runtime-packages`
	})

	const version = getTutanotaAppVersion()

	await runStep("Types", async () => {
		await $`npx tsc --incremental true --noEmit true`
	})


	const mode = desktop ? "Desktop" : "Browser"
	await buildWebPart({stage, host, version, mode})

	if (desktop) {
		await buildDesktopPart({version})
	}
}

async function buildWebPart({stage, host, version}) {
	await runStep("Web: Assets", async () => {
		await prepareAssets(stage, host, version)
		await fs.promises.writeFile("build/worker-bootstrap.js", `importScripts("./polyfill.js")
importScripts("./worker.js")
`)
	})

	await runStep("Web: Esbuild", async () => {
		await build({
			// Using named entry points so that it outputs build/worker.js and not build/api/worker/worker.js
			entryPoints: {app: "src/app.ts", worker: "src/api/worker/worker.ts"},
			outdir: "./build/",
			// Why bundle at the moment:
			// - We need to include all the imports: everything in src + libs. We could use wildcard in the future.
			// - We can't have imports or dynamic imports in the worker because we can't start it as a module because of Firefox.
			//     (see https://bugzilla.mozilla.org/show_bug.cgi?id=1247687)
			//     We can theoretically compile it separately but it will be slower and more confusing.
			bundle: true,
			format: 'esm',
			sourcemap: "linked",
			define: {
				// See Env.ts for explanation
				"NO_THREAD_ASSERTIONS": 'true',
			},
			plugins: [
				libDeps(),
				externalTranslationsPlugin(),
			],
		})
	})
}

async function buildDesktopPart({version}) {
	await runStep("Desktop: Esbuild", async () => {
		await build({
			entryPoints: ["src/desktop/DesktopMain.ts"],
			outdir: "./build/desktop",
			// Why we bundle at the moment:
			// - We need to include all the imports: we currently use some node_modules directly, without pre-bundling them like rest of libs we can't avoid it
			bundle: true,
			format: 'cjs',
			sourcemap: "linked",
			platform: "node",
			external: ["electron"],
			plugins: [
				libDeps(),
				sqliteNativePlugin({
					environment: "electron",
					dstPath: "./build/desktop/better_sqlite3.node",
					platform: process.platform,
					nativeBindingPath: "./better_sqlite3.node",
				}),
				keytarNativePlugin({
					environment: "electron",
					dstPath: "./build/desktop/keytar.node",
					nativeBindingPath: './keytar.node',
					platform: process.platform,
				}),
				preludeEnvPlugin(env.create({staticUrl: null, version, mode: "Desktop", dist: false})),
				externalTranslationsPlugin(),
			],
		})
	})

	await runStep("Desktop: assets", async () => {
		const desktopIconsPath = "./resources/desktop-icons"
		await fs.copy(desktopIconsPath, "./build/desktop/resources/icons", {overwrite: true})
		const packageJSON = (await import('./electron-package-json-template.js')).default({
			nameSuffix: "-debug",
			version,
			updateUrl: "http://localhost:9000/client/build",
			iconPath: path.join(desktopIconsPath, "logo-solo-red.png"),
			sign: false
		})
		const content = JSON.stringify(packageJSON, null, 2)

		await fs.createFile("./build/package.json")
		await fs.writeFile("./build/package.json", content, 'utf-8')

		await fs.mkdir("build/desktop", {recursive: true})
		await fs.copyFile("src/desktop/preload.js", "build/desktop/preload.js")
		await fs.copyFile("src/desktop/preload-webdialog.js", "build/desktop/preload-webdialog.js")
	})
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