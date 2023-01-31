import path from "path"
import fs from "fs-extra"
import { build as esbuild } from "esbuild"
import { getTutanotaAppVersion, runStep, sh, writeFile } from "./buildUtils.js"
import { $ } from "zx"
import "zx/globals"
import * as env from "./env.js"
import { externalTranslationsPlugin, keytarNativePlugin, libDeps, preludeEnvPlugin, sqliteNativePlugin } from "./esbuildUtils.js"
import { fileURLToPath } from "url"
import * as LaunchHtml from "./LaunchHtml.js"
import os from "os"
import { checkOfflineDatabaseMigrations } from "./checkOfflineDbMigratons.js"

export async function runDevBuild({ stage, host, desktop, clean, ignoreMigrations }) {
	if (clean) {
		await runStep("Clean", async () => {
			await fs.emptyDir("build")
		})
	}

	await runStep("Validate", () => {
		if (ignoreMigrations) {
			console.warn("CAUTION: Offline migrations are not being validated.")
		} else {
			checkOfflineDatabaseMigrations()
		}
	})

	await runStep("Packages", async () => {
		await $`npm run build-runtime-packages`
	})

	const version = getTutanotaAppVersion()

	await runStep("Types", async () => {
		await sh`npx tsc --incremental ${true} --noEmit true`
	})

	const mode = desktop ? "Desktop" : "Browser"
	await buildWebPart({ stage, host, version, mode })

	if (desktop) {
		await buildDesktopPart({ version })
	}
}

async function buildWebPart({ stage, host, version }) {
	await runStep("Web: Assets", async () => {
		await prepareAssets(stage, host, version)
		await fs.promises.writeFile(
			"build/worker-bootstrap.js",
			`importScripts("./polyfill.js")
importScripts("./worker.js")
`,
		)
	})

	await runStep("Web: Esbuild", async () => {
		await esbuild({
			// Using named entry points so that it outputs build/worker.js and not build/api/worker/worker.js
			entryPoints: { app: "src/app.ts", worker: "src/api/worker/worker.ts" },
			outdir: "./build/",
			// Why bundle at the moment:
			// - We need to include all the imports: everything in src + libs. We could use wildcard in the future.
			// - We can't have imports or dynamic imports in the worker because we can't start it as a module because of Firefox.
			//     (see https://bugzilla.mozilla.org/show_bug.cgi?id=1247687)
			//     We can theoretically compile it separately but it will be slower and more confusing.
			bundle: true,
			format: "esm",
			// "both" is the most reliable as in Worker or on Android linked source maps don't work
			sourcemap: "both",
			define: {
				// See Env.ts for explanation
				NO_THREAD_ASSERTIONS: "true",
			},
			plugins: [libDeps(), externalTranslationsPlugin()],
		})
	})
}

async function buildDesktopPart({ version }) {
	await runStep("Desktop: Esbuild", async () => {
		await esbuild({
			entryPoints: ["src/desktop/DesktopMain.ts"],
			outdir: "./build/desktop",
			// Why we bundle at the moment:
			// - We need to include all the imports: we currently use some node_modules directly, without pre-bundling them like rest of libs we can't avoid it
			bundle: true,
			format: "cjs",
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
					nativeBindingPath: "./keytar.node",
					platform: process.platform,
				}),
				preludeEnvPlugin(env.create({ staticUrl: null, version, mode: "Desktop", dist: false })),
				externalTranslationsPlugin(),
			],
		})
	})

	await runStep("Desktop: assets", async () => {
		const desktopIconsPath = "./resources/desktop-icons"
		await fs.copy(desktopIconsPath, "./build/desktop/resources/icons", { overwrite: true })
		const templateGenerator = (await import("./electron-package-json-template.js")).default
		const packageJSON = await templateGenerator({
			nameSuffix: "-debug",
			version,
			updateUrl: "http://localhost:9000/client/build",
			iconPath: path.join(desktopIconsPath, "logo-solo-red.png"),
			sign: false,
			linux: process.platform === "linux",
		})
		const content = JSON.stringify(packageJSON, null, 2)

		await fs.createFile("./build/package.json")
		await fs.writeFile("./build/package.json", content, "utf-8")

		await fs.mkdir("build/desktop", { recursive: true })
		await fs.copyFile("src/desktop/preload.js", "build/desktop/preload.js")
		await fs.copyFile("src/desktop/preload-webdialog.js", "build/desktop/preload-webdialog.js")
	})
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname.split(path.sep).slice(0, -1).join(path.sep)

async function createBootstrap(env) {
	let jsFileName
	let htmlFileName
	switch (env.mode) {
		case "App":
			jsFileName = "index-app.js"
			htmlFileName = "index-app.html"
			break
		case "Browser":
			jsFileName = "index.js"
			htmlFileName = "index.html"
			break
		case "Desktop":
			jsFileName = "index-desktop.js"
			htmlFileName = "index-desktop.html"
	}
	const imports = [{ src: "polyfill.js" }, { src: jsFileName }]

	const template = `window.whitelabelCustomizations = null
window.env = ${JSON.stringify(env, null, 2)}
if (env.staticUrl == null && window.tutaoDefaultApiUrl) {
    // overriden by js dev server
    window.env.staticUrl = window.tutaoDefaultApiUrl
}
import('./app.js')`
	await writeFile(`./build/${jsFileName}`, template)
	const html = await LaunchHtml.renderHtml(imports, env)
	await writeFile(`./build/${htmlFileName}`, html)
}

function getStaticUrl(stage, mode, host) {
	if (stage === "local" && mode === "Browser") {
		// We would like to use web app build for both JS server and actual server. For that we should avoid hardcoding URL as server
		// might be running as one of testing HTTPS domains. So instead we override URL when the app is served from JS server
		// (see DevServer).
		// This is only relevant for browser environment.
		return null
	} else if (stage === "test") {
		return "https://test.tutanota.com"
	} else if (stage === "prod") {
		return "https://mail.tutanota.com"
	} else if (stage === "local") {
		return "http://" + os.hostname() + ":9000"
	} else {
		// host
		return host
	}
}

export async function prepareAssets(stage, host, version) {
	await Promise.all([
		await fs.emptyDir(path.join(root, "build/images")),
		fs.copy(path.join(root, "/resources/favicon"), path.join(root, "/build/images")),
		fs.copy(path.join(root, "/resources/images/"), path.join(root, "/build/images")),
		fs.copy(path.join(root, "/resources/desktop-icons"), path.join(root, "/build/icons")),
		fs.copy(path.join(root, "/resources/wordlibrary.json"), path.join(root, "build/wordlibrary.json")),
		fs.copy(path.join(root, "/src/braintree.html"), path.join(root, "build/braintree.html")),
	])

	// write empty file
	await fs.writeFile("build/polyfill.js", "")

	for (const mode of ["Browser", "App", "Desktop"]) {
		await createBootstrap(env.create({ staticUrl: getStaticUrl(stage, mode, host), version, mode, dist: false }))
	}
}
