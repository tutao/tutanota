/**
 * Exports the buildWebapp function that can be used for production builds.
 */
import * as esbuild from "esbuild"
import path from "node:path"
import fs from "fs-extra"
import { dependencyMap } from "./RollupConfig.js"
import os from "node:os"
import * as env from "./env.js"
import { createHtml } from "./createHtml.js"
import { domainConfigs } from "./DomainConfigs.js"
import { runStep } from "./buildUtils.js"
import { execSync } from "node:child_process"
import { buildArgon2, buildLibOqs } from "./buildWasm.js"
import { appTypeForApp, buildDirForApp, entryPointsForApp } from "./DevBuild.js"

/**
 * Builds the web app for production.
 * @param version Version of the app. Will be used for html generation and service worker versioning.
 * @param stage Deployment for which to build: 'prod' will build for the production system, 'test' for the test system, 'local' will use localhost.
 * @param host If stage is left undefined, the value provided here will be used to construct the app URL for HTML creation.
 * @param measure Function that returns the current elapsed build time.
 * @param minify Boolean. Set to true to perform minification.
 * @param projectDir Path to the tutanota root directory.
 * @param app App to build, 'mail' for mail app and 'calendar' for calendar app
 * @param mobileBuild Whether the current build is for the mobile app.
 * @returns Nothing meaningful.
 */

export async function buildWebapp({ version, stage, host, measure, minify, projectDir, app, mobileBuild = false }) {
	const buildDir = buildDirForApp(app)
	const resolvedBuildDir = path.resolve(buildDir)
	const { entry: entryFile, worker: workerFile } = entryPointsForApp(app)
	const { restUrl, networkDebugging } = (() => {
		switch (stage) {
			case "test":
				return { restUrl: "https://app.test.tuta.com", networkDebugging: false }
			case "prod":
				return { restUrl: "https://app.tuta.com", networkDebugging: false }
			case "local":
				return { restUrl: "http://" + os.hostname() + ":9000", networkDebugging: false }
			case "release":
				return { restUrl: undefined, networkDebugging: false }
			default:
				return { restUrl: host, networkDebugging: true }
		}
	})()

	console.log("Building app", app)

	await runStep(`Cleaning build dir ${measure()}`, () => {
		fs.emptyDirSync(buildDir)
	})

	await runStep(`Bundeling polyfill ${measure()}`, async () => {
		await esbuild.build({
			entryPoints: ["src/polyfill.js"],
			bundle: true,
			format: "iife",
			outfile: `${buildDir}/polyfill.js`,
			sourcemap: false,
			minify,
		})
	})

	await runStep(`Copying images ${measure()}`, () => {
		fs.copySync(path.join(projectDir, "/resources/images"), path.join(projectDir, `/${buildDir}/images`))
		fs.copySync(path.join(projectDir, "/resources/favicon"), path.join(projectDir, `${buildDir}/images`))
		fs.copySync(path.join(projectDir, "/resources/pdf"), path.join(projectDir, `${buildDir}/pdf`))
		fs.copySync(path.join(projectDir, "/resources/wordlibrary.json"), path.join(projectDir, `${buildDir}/wordlibrary.json`))
		fs.copySync(path.join(projectDir, "/src/braintree.html"), path.join(projectDir, `/${buildDir}/braintree.html`))
	})

	await runStep("Build crypto-primitives", async () => {
		const targetDir = path.resolve(buildDir)
		execSync(`node make ${targetDir}`, { stdio: "inherit", cwd: "src/crypto" })
	})

	await runStep("Build mimimi", async () => {
		execSync("node make --release", { cwd: "src/mimimi", stdio: "inherit" })
	})

	await runStep("Types with emit", () => {
		execSync(`npm run ${app ?? "mail"}:types`, { stdio: "inherit" })
	})
	await buildArgon2(resolvedBuildDir)
	await buildLibOqs(resolvedBuildDir)

	// Translation files as explicit entry points so the service worker can identify them by name.
	const translationEntries = Object.fromEntries(
		fs
			.readdirSync("src/ui/translations")
			.filter((f) => f.endsWith(".ts"))
			.map((f) => [`translation-${f.slice(0, -3)}`, `src/ui/translations/${f}`]),
	)

	// Vendored library aliases: bare specifiers only (./tensorflow-custom handled by plugin).
	// Packages with .d.ts-only const enums are overridden to point to runtime .ts files.
	const alias = {
		...Object.fromEntries(
			Object.entries(dependencyMap)
				.filter(([k]) => !k.startsWith("./"))
				.map(([k, v]) => [k, path.resolve(v)]),
		),
		// These packages have const enums used as runtime values but only .d.ts declarations.
		// Point esbuild at the .ts source files so it emits regular enum objects at runtime.
		"@tutao/rest-client/types": path.resolve("src/rest-client/types.ts"),
		"@tutao/network/types": path.resolve("src/network/types.ts"),
		// Use our index.ts barrel (re-exports const enums as regular enums via esbuild).
		"@tutao/native-bridge/generatedIpc/types": path.resolve("src/native-bridge/common/generatedipc/types/index.ts"),
	}

	console.log("started bundling", measure())
	const result = await esbuild.build({
		entryPoints: {
			app: entryFile,
			worker: workerFile,
			"pow-worker": "src/common/api/common/pow-worker.ts",
			...translationEntries,
		},
		bundle: true,
		splitting: true,
		format: "esm",
		outdir: buildDir,
		sourcemap: true,
		minify,
		metafile: true,
		define: {
			APP_TYPE: appTypeForApp(app),
		},
		// tsconfig_common.json provides paths for all @tutao/* packages not in alias above.
		tsconfig: "./tsconfig_common.json",
		alias,
		plugins: [tensorflowAliasPlugin()],
		// qrcode-svg optionally imports node:fs; mark external to avoid bundling errors in browser build.
		external: ["fs"],
	})
	console.log("finished bundling", measure())

	const chunks = Object.keys(result.metafile.outputs)
		.filter((f) => f.endsWith(".js"))
		.map((f) => path.relative(buildDir, f))

	// we have to use System.import here because bootstrap is not executed until we actually import()
	// unlike nollup+es format where it just runs on being loaded like you expect
	await fs.promises.writeFile(
		`${buildDir}/worker-bootstrap.js`,
		`import "./polyfill.js"
import "./worker.js"`,
	)

	await createHtml(
		env.create({
			staticUrl: stage === "release" || stage === "local" ? null : restUrl,
			version,
			mode: "Browser",
			dist: true,
			domainConfigs,
			networkDebugging,
		}),
		app,
	)
	if (stage !== "release") {
		await createHtml(
			env.create({
				staticUrl: restUrl,
				version,
				mode: "App",
				dist: true,
				domainConfigs,
				networkDebugging,
			}),
			app,
		)
	}

	await bundleServiceWorker(chunks, version, minify, buildDir)
}

/**
 * esbuild plugin that redirects the relative `./tensorflow-custom` specifier to the vendored lib.
 * The esbuild `alias` option only works for bare (non-relative) specifiers, so we need a plugin.
 */
function tensorflowAliasPlugin() {
	return {
		name: "tensorflow-alias",
		setup(build) {
			build.onResolve({ filter: /^\.\/tensorflow-custom$/ }, () => ({
				path: path.resolve(dependencyMap["./tensorflow-custom"]),
			}))
		},
	}
}

/**
 * @param bundles {string[]}
 * @param version {string}
 * @param minify {boolean}
 * @param buildDir {string}
 * @returns {Promise<void>}
 */
async function bundleServiceWorker(bundles, version, minify, buildDir) {
	const customDomainFileExclusions = ["index.html", "index.js"]
	const filesToCache = ["index.js", "index.html", "polyfill.js", "worker-bootstrap.js"]
		// we always include English; exclude other translations (loaded on demand)
		.concat(bundles.filter((it) => it.startsWith("translation-en") || !it.startsWith("translation")).sort())
		.concat(["images/apple-touch-icon.png", "images/logo-favicon.svg", "images/logo-favicon-192.png", "images/font.ttf"])

	await esbuild.build({
		entryPoints: ["src/common/serviceworker/sw.ts"],
		bundle: true,
		format: "iife",
		outfile: `${buildDir}/sw.js`,
		sourcemap: true,
		minify,
		tsconfig: "./tsconfig_common.json",
		banner: {
			js: `function filesToCache() { return ${JSON.stringify(filesToCache.sort())} }
function version() { return "${version}" }
function customDomainCacheExclusions() { return ${JSON.stringify(customDomainFileExclusions)} }`,
		},
	})
}
