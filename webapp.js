/**
 * Script to build and publish release versions of the app.
 *
 * <h2>Bundling</h2>
 *
 * Bundling is manual. Rollup makes no attempt to optimize chunk sizes anymore and we can do it much better manually anyway because we
 * know what is needed together.
 *
 * Unfortunately manual bundling is "infectious" in a sense that if you manually put module in a chunk all its dependencies will also be
 * put in that chunk unless they are sorted into another manual chunk. Ideally this would be semi-automatic with directory-based chunks.
 */
import { Argument, program } from "commander"
import fs from "fs-extra"
import path, { dirname } from "node:path"
import { buildWebapp } from "./buildSrc/buildWebapp.js"
import { getTutanotaAppVersion, measure } from "./buildSrc/buildUtils.js"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// We use terser for minimifaction but we don't use nameCache because it does not work.
// It does not work because there's no top-level code besides invocations of System.register and non-top-level code is not put into cache
// which looks like a problem e.g. for accessing fields.

await program
	.usage('[options] [test|prod|local|release|host <url>], "release" is default')
	.description("Utility to build the web part of tuta")
	.addArgument(new Argument("stage").choices(["test", "prod", "local", "host", "release"]).default("prod").argOptional())
	.addArgument(new Argument("host").argOptional())
	.option("--app <app>", "app to build", "mail")
	.option("--disable-minify", "disable minification")
	.option("--out-dir <outDir>", "where to copy the client")
	.action(async (stage, host, options) => {
		if (process.env.DEBUG_SIGN && !fs.existsSync(path.join(process.env.DEBUG_SIGN, "test.p12"))) {
			console.error("ERROR:\nPlease make sure your DEBUG_SIGN test certificate authority is set up properly!\n\n")
			process.exit(1)
		}

		if ((stage === "host" && host == null) || (stage !== "host" && host != null) || (stage !== "release" && options.publish)) {
			program.outputHelp()
			process.exit(1)
		}

		options.stage = stage ?? "release"
		options.host = host

		await doBuild(options)
	})
	.parseAsync(process.argv)

async function doBuild(options) {
	try {
		measure()
		const version = await getTutanotaAppVersion()
		const minify = options.disableMinify !== true

		if (!minify) {
			console.warn("Minification is disabled")
		}

		await buildWebapp({
			version,
			stage: options.stage,
			host: options.host,
			measure,
			minify,
			projectDir: __dirname,
			app: options.app,
		})

		const now = new Date(Date.now()).toTimeString().substr(0, 5)
		console.log(`\nBuild time: ${measure()}s (${now})`)
		process.exit(0)
	} catch (e) {
		console.error("\nBuild error:", e)
		process.exit(1)
	}
}
