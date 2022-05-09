import path from "path"
import fs from "fs-extra"
import {prepareAssets} from "./Builder.js"
import {build} from "esbuild"
import {getTutanotaAppVersion} from "./buildUtils.js"
import {$} from "zx"
import {keytarNativePlugin, sqliteNativePlugin} from "./nativeLibraryEsbuildPlugin.js"
import * as env from "./env.js"
import {dependencyMap} from "./RollupConfig.js"
import {esbuildPluginAliasPath} from "esbuild-plugin-alias-path"
import {runStep} from "./runStep.js"

export async function runDevBuild({stage, host, desktop, clean, watch}) {
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
importScripts("./api/worker/worker.js")
`)
	})

	await runStep("Web: Esbuild", async () => {
		await build({
			entryPoints: ["src/app.ts", "src/api/worker/worker.ts"],
			outdir: "./build/",
			bundle: true,
			format: 'esm',
			sourcemap: "linked",
			define: {
				// See Env.ts for explanation
				"NO_THREAD_ASSERTIONS": 'true',
			},
			plugins: [
				libDeps(),
			],
		})
	})
}

async function buildDesktopPart({version}) {
	await runStep("Desktop: Esbuild", async () => {
		await build({
			entryPoints: ["src/desktop/DesktopMain.ts"],
			outdir: "./build/desktop",
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
				preludeEnvPlugin(env.create({staticUrl: null, version, mode: "Desktop", dist: false}))
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