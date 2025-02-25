import path, { dirname } from "node:path"
import fs from "fs-extra"
import { getCanonicalPlatformName, getTutanotaAppVersion, getValidArchitecture, runStep, writeFile } from "./buildUtils.js"
import "zx/globals"
import * as env from "./env.js"
import { preludeEnvPlugin } from "./env.js"
import { fileURLToPath } from "node:url"
import * as LaunchHtml from "./LaunchHtml.js"
import os from "node:os"
import { checkOfflineDatabaseMigrations } from "./checkOfflineDbMigratons.js"
import { buildRuntimePackages } from "./packageBuilderFunctions.js"
import { domainConfigs } from "./DomainConfigs.js"
import { sh } from "./sh.js"
import { rolldown } from "rolldown"
import { resolveLibs } from "./RollupConfig.js"
import { nodeGypPlugin } from "./nodeGypPlugin.js"
import { napiPlugin } from "./napiPlugin.js"

const buildSrc = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.join(buildSrc, ".."))

export async function runDevBuild({ stage, host, desktop, clean, ignoreMigrations, app }) {
	const isCalendarBuild = app === "calendar"
	const tsConfig = isCalendarBuild ? "tsconfig-calendar-app.json" : "tsconfig.json"
	const buildDir = isCalendarBuild ? "build-calendar-app" : "build"
	const liboqsIncludeDir = "libs/webassembly/include"

	console.log("Building dev for", app)

	if (clean) {
		await runStep("Clean", async () => {
			await fs.emptyDir(buildDir)
			await fs.rm(liboqsIncludeDir, { recursive: true, force: true })
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
		await sh`npx tsc --project ${tsConfig} --incremental ${true} --noEmit true`
	})

	/**
	 * @param host {string|null}
	 * @return {DomainConfigMap}
	 */
	function updateDomainConfigForHostname(host) {
		if (host == null) {
			return { ...domainConfigs }
		} else {
			const url = new URL(host)
			const { protocol, hostname } = url
			const port = parseInt(url.port)
			// the URL object does not include the port if it is the schema's default
			const uri = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`
			return {
				...domainConfigs,
				[url.hostname]: {
					firstPartyDomain: true,
					partneredDomainTransitionUrl: uri,
					apiUrl: uri,
					paymentUrl: `${uri}/braintree.html`,
					webauthnUrl: `${uri}/webauthn`,
					legacyWebauthnUrl: `${uri}/webauthn`,
					webauthnMobileUrl: `${uri}/webauthnmobile`,
					legacyWebauthnMobileUrl: `${uri}/webauthnmobile`,
					webauthnRpId: hostname,
					u2fAppId: `${uri}/u2f-appid.json`,
					giftCardBaseUrl: `${uri}/giftcard`,
					referralBaseUrl: `${uri}/signup`,
					websiteBaseUrl: "https://tuta.com",
				},
			}
		}
	}

	const extendedDomainConfigs = updateDomainConfigForHostname(host)

	await buildWebPart({ stage, host, version, domainConfigs: extendedDomainConfigs, app })

	if (desktop) {
		await buildDesktopPart({ version, app })
	}
}

/**
 * @param p {object}
 * @param p.stage {string}
 * @param p.host {string|null}
 * @param p.version {string}
 * @param p.domainConfigs {DomainConfigMap}
 * @param p.app {string}
 * @return {Promise<void>}
 */
async function buildWebPart({ stage, host, version, domainConfigs, app }) {
	const isCalendarBuild = app === "calendar"
	const buildDir = isCalendarBuild ? "build-calendar-app" : "build"
	const resolvedBuildDir = path.resolve(buildDir)
	const entryFile = isCalendarBuild ? "src/calendar-app/calendar-app.ts" : "src/mail-app/app.ts"
	const workerFile = isCalendarBuild ? "src/calendar-app/workerUtils/worker/calendar-worker.ts" : "src/mail-app/workerUtils/worker/mail-worker.ts"

	await runStep("Web: Rolldown", async () => {
		const { rollupWasmLoader } = await import("@tutao/tuta-wasm-loader")
		const bundle = await rolldown({
			input: { app: entryFile, worker: workerFile },
			define: {
				// Need it at least until inlining enums is supported
				LOAD_ASSERTIONS: "false",
			},
			external: "fs", // qrcode-svg tries to import it on save()
			plugins: [
				resolveLibs(),
				rollupWasmLoader({
					webassemblyLibraries: [
						{
							name: "liboqs.wasm",
							command: "make -f Makefile_liboqs build",
							workingDir: "libs/webassembly/",
							outputPath: path.join(resolvedBuildDir, `/wasm/liboqs.wasm`),
						},
						{
							name: "argon2.wasm",
							command: "make -f Makefile_argon2 build",
							workingDir: "libs/webassembly/",
							outputPath: path.join(resolvedBuildDir, `/wasm/argon2.wasm`),
						},
					],
				}),
			],
		})
		await bundle.write({
			dir: `./${buildDir}/`,
			format: "esm",
			// Setting source map to inline for web part because source maps won't be loaded correctly on mobile because requests from dev tools are not
			// intercepted, so we can't serve the files.
			sourcemap: "inline",
			// overwrite the files rather than keeping all versions in the build folder
			chunkFileNames: "[name]-chunk.js",
		})
	})

	// Do assets last so that server that listens to index.html changes does not reload too early

	await runStep("Web: Assets", async () => {
		await prepareAssets(stage, host, version, domainConfigs, buildDir)
		await fs.promises.writeFile(
			`${buildDir}/worker-bootstrap.js`,
			`import "./polyfill.js"
import "./worker.js"
`,
		)
	})
}

async function buildDesktopPart({ version, app }) {
	const isCalendarBuild = app === "calendar"
	const buildDir = isCalendarBuild ? "build-calendar-app" : "build"

	await runStep("Desktop: Rolldown", async () => {
		const bundle = await rolldown({
			input: ["src/common/desktop/DesktopMain.ts", "src/common/desktop/sqlworker.ts"],
			platform: "node",
			external: [
				"electron",
				"memcpy", // optional dep of oxmsg
			],
			plugins: [
				resolveLibs(),
				nodeGypPlugin({
					rootDir: projectRoot,
					platform: getCanonicalPlatformName(process.platform),
					architecture: getValidArchitecture(process.platform, process.arch),
					nodeModule: "better-sqlite3",
					environment: "electron",
				}),
				napiPlugin({
					nodeModule: "@tutao/node-mimimi",
					platform: getCanonicalPlatformName(process.platform),
					architecture: getValidArchitecture(process.platform, process.arch),
				}),
				preludeEnvPlugin(env.create({ staticUrl: null, version, mode: "Desktop", dist: false, domainConfigs })),
			],
		})

		await bundle.write({
			dir: `./${buildDir}/desktop`,
			format: "esm",
			sourcemap: true,
			// overwrite the files rather than keeping all versions in the build folder
			chunkFileNames: "[name]-chunk.js",
		})
	})

	await runStep("Desktop: assets", async () => {
		const desktopIconsPath = "./resources/desktop-icons"
		await fs.copy(desktopIconsPath, `./${buildDir}/desktop/resources/icons`, { overwrite: true })
		await fs.move(`./${buildDir}/desktop/resources/icons/logo-solo-dev.png`, `./${buildDir}/desktop/resources/icons/logo-solo-red.png`, { overwrite: true })
		await fs.move(`./${buildDir}/desktop/resources/icons/logo-solo-dev-small.png`, `./${buildDir}/desktop/resources/icons/logo-solo-red-small.png`, {
			overwrite: true,
		})
		const templateGenerator = (await import("./electron-package-json-template.js")).default
		const packageJSON = await templateGenerator({
			nameSuffix: "-debug",
			version,
			updateUrl: `http://localhost:9000/client/${buildDir}`,
			iconPath: path.join(desktopIconsPath, "logo-solo-red.png"),
			sign: false,
			architecture: "x64",
		})
		const content = JSON.stringify(packageJSON, null, 2)

		await fs.createFile(`./${buildDir}/package.json`)
		await fs.writeFile(`./${buildDir}/package.json`, content, "utf-8")

		await fs.mkdir(`${buildDir}/desktop`, { recursive: true })
		// The preload scripts are run as commonjs scripts and are a special environment so we just copy them directly.
		await fs.copyFile("src/common/desktop/preload.js", `${buildDir}/desktop/preload.js`)
		await fs.copyFile("src/common/desktop/preload-webdialog.js", `${buildDir}/desktop/preload-webdialog.js`)
	})
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname.split(path.sep).slice(0, -1).join(path.sep)

async function createBootstrap(env, buildDir) {
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
	await writeFile(`./${buildDir}/${jsFileName}`, template)
	const html = await LaunchHtml.renderHtml(imports, env)
	await writeFile(`./${buildDir}/${htmlFileName}`, html)
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

/**
 * @param stage {string}
 * @param host {string|null}
 * @param version {string}
 * @param domainConfigs {DomainConfigMap}
 * @param buildDir {string}
 * @return {Promise<void>}
 */
export async function prepareAssets(stage, host, version, domainConfigs, buildDir) {
	await Promise.all([
		await fs.emptyDir(path.join(root, `${buildDir}/images`)),
		fs.copy(path.join(root, "/resources/favicon"), path.join(root, `/${buildDir}/images`)),
		fs.copy(path.join(root, "/resources/images/"), path.join(root, `/${buildDir}/images`)),
		fs.copy(path.join(root, "/resources/pdf/"), path.join(root, `/${buildDir}/pdf`)),
		fs.copy(path.join(root, "/resources/desktop-icons"), path.join(root, `/${buildDir}/icons`)),
		fs.copy(path.join(root, "/resources/wordlibrary.json"), path.join(root, `${buildDir}/wordlibrary.json`)),
		fs.copy(path.join(root, "/src/braintree.html"), path.join(root, `${buildDir}/braintree.html`)),
	])

	// write empty file
	await fs.writeFile(`${buildDir}/polyfill.js`, "")

	/** @type {EnvMode[]} */
	const modes = ["Browser", "App", "Desktop"]
	for (const mode of modes) {
		await createBootstrap(env.create({ staticUrl: getStaticUrl(stage, mode, host), version, mode, dist: false, domainConfigs }), buildDir)
	}
}
