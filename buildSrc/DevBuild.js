import path from "node:path"
import fs from "fs-extra"
import { build as esbuild } from "esbuild"
import { getTutanotaAppVersion, runStep, writeFile } from "./buildUtils.js"
import "zx/globals"
import * as env from "./env.js"
import { externalTranslationsPlugin, libDeps, preludeEnvPlugin, sqliteNativePlugin } from "./esbuildUtils.js"
import { fileURLToPath } from "node:url"
import * as LaunchHtml from "./LaunchHtml.js"
import os from "node:os"
import { checkOfflineDatabaseMigrations } from "./checkOfflineDbMigratons.js"
import { buildRuntimePackages } from "./packageBuilderFunctions.js"
import { domainConfigs } from "./DomainConfigs.js"
import { sh } from "./sh.js"
import { wasmLoader } from "esbuild-plugin-wasm"

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
		await buildRuntimePackages()
	})

	const version = await getTutanotaAppVersion()

	await runStep("Types", async () => {
		await sh`npx tsc --incremental ${true} --noEmit true`
	})

	const mode = desktop ? "Desktop" : "Browser"
	await buildWebPart({ stage, host, version, mode })

	if (desktop) {
		await buildDesktopPart({ version })
	}
}

async function buildWebPart({ stage, host, version, mode }) {
	await runStep("Web: Assets", async () => {
		await prepareAssets(stage, host, version)
		await fs.promises.writeFile(
			"build/worker-bootstrap.js",
			`importScripts("./polyfill.js")
// We want to run worker as en ES module but Safari still (as of 17.2) does not support type parameter for the worker constructor.
// We want es modules at least because of import.meta.url for loading WASM.
// Gladly we can have es modules via dynamic imports.
// Sadly current worker protocol relies on the MessagePort queueing so we need to set onmessge handler right away (even if we wait for the worker to send a
// message before calling setup() the rest of the app does not wait, we need to queue somewhere).
// This helps to bridge the gap between module support and queueing. There is still a little chance that then() won't run in the same order and we will get
// a message before setup() but it is unlikely. If that happens we need to build a proper queue.
// onmessage handler will be overriden once more in worker.ts and then once again in WorkerImpl (by making a WebWorkerTransport).
// Why don't we do this piece of code in worker.ts then and make a "ESM world" split there? glad you asked! esbuild (as it's used here) rolls up all the dynamic
// imports into the same bundle so even if we import WorkerImpl dynamically it will executed in the same context as worker.ts which we would need to import
// synchronously to set the handler right away.
let workerImport
self.onmessage = (msg) => workerImport.then(() => self.onmessage(msg))
workerImport = import("./worker.js")
`,
		)
	})

	await runStep("Web: Esbuild", async () => {
		await esbuild({
			// Using named entry points so that it outputs build/worker.js and not build/api/worker/worker.js
			entryPoints: [
				{ in: "src/app.ts", out: "app" },
				{ in: "src/api/worker/worker.ts", out: "worker" },
			],
			outdir: "./build/",
			outbase: ".",
			// Why bundle at the moment:
			// - We need to include all the imports: everything in src + libs. We could use wildcard in the future.
			bundle: true,
			format: "esm",
			// "both" is the most reliable as in Worker or on Android linked source maps don't work
			sourcemap: "both",
			define: {
				// See Env.ts for explanation
				NO_THREAD_ASSERTIONS: "true",
			},
			plugins: [libDeps(), externalTranslationsPlugin(), wasmLoader({ mode: "deferred" })],
		})
	})
}

async function buildDesktopPart({ version }) {
	await runStep("Desktop: Esbuild", async () => {
		await esbuild({
			entryPoints: ["src/desktop/DesktopMain.ts", "src/desktop/sqlworker.ts"],
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
					architecture: process.arch,
					nativeBindingPath: "./better_sqlite3.node",
				}),
				preludeEnvPlugin(env.create({ staticUrl: null, version, mode: "Desktop", dist: false, domainConfigs })),
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
			architecture: "x64",
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
		return "https://app.test.tuta.com"
	} else if (stage === "prod") {
		return "https://app.tuta.com"
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
		fs.copy(path.join(root, "/resources/pdf/"), path.join(root, "/build/pdf")),
		fs.copy(path.join(root, "/resources/desktop-icons"), path.join(root, "/build/icons")),
		fs.copy(path.join(root, "/resources/wordlibrary.json"), path.join(root, "build/wordlibrary.json")),
		fs.copy(path.join(root, "/src/braintree.html"), path.join(root, "build/braintree.html")),
	])

	const wasmDir = path.join(root, "/build/wasm")
	await Promise.all([
		await fs.emptyDir(wasmDir),
		fs.copy(path.join(root, "/packages/tutanota-crypto/lib/hashes/Argon2id/argon2.wasm"), path.join(wasmDir, "argon2.wasm")),
		fs.copy(path.join(root, "/packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm"), path.join(wasmDir, "liboqs.wasm")),
		// fs.copy(path.join(root, "/packages/tuta-sdk/tutasdk_bg.wasm"), path.join(wasmDir, "tutasdk.wasm")),
	])

	// write empty file
	await fs.writeFile("build/polyfill.js", "")

	for (const mode of ["Browser", "App", "Desktop"]) {
		await createBootstrap(env.create({ staticUrl: getStaticUrl(stage, mode, host), version, mode, dist: false, domainConfigs }))
	}
}
