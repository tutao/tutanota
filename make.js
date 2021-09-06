import options from "commander"
import fs from "fs-extra"
import {spawn} from "child_process"
import {BuildServerClient} from "@tutao/tutanota-build-server"
import path from "path"
import {fetchDictionaries} from "./buildSrc/DictionaryFetcher.js"

let opts
options
	.usage('[options] [test|prod|local|host <url>], "local" is default')
	.arguments('[stage] [host]')
	.option('-c, --clean', 'Clean build directory')
	.option('-w, --watch', 'Watch build dir and rebuild if necessary')
	.option('-d, --desktop', 'Assemble & start desktop client')
	.option('-s, --serve', 'Start a local server to serve the website')
	.action(function (stage, host) {
		opts = options.opts()
		if (!["test", "prod", "local", "host", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)) {
			options.outputHelp()
			process.exit(1)
		}
		opts.stage = stage || "local"
		opts.host = host
	})
	.parse(process.argv)

if (options.clean) {
	console.log("cleaning build dir")
	fs.emptyDir("build")
}

runBuild()

async function runBuild() {
	let buildServerOptions = {
		forceRestart: typeof (opts.clean) !== "undefined" ? opts.clean : false,
		builderPath: path.resolve("./buildSrc/Builder.js"),
		preserveLogs: true,
		autoRebuild: typeof (opts.watch) !== "undefined" ? opts.watch : false,
		buildOpts: opts,
		watchFolders: [path.resolve("src")]
	}

	if (opts.serve) {
		buildServerOptions.devServerPort = 9001
		buildServerOptions.webRoot = path.resolve('build')
		buildServerOptions.spaRedirect = true
	}

	try {
		const buildServerClient = new BuildServerClient("make")
		await buildServerClient.buildWithServer(buildServerOptions)

		const dictPath = "build/dictionaries"
		if (!fs.existsSync(dictPath)) {
			const {devDependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
			await fetchDictionaries(devDependencies.electron, [dictPath])
		}

		if (opts.desktop) {
			// we don't want to quit here because we want to keep piping output to our stdout.
			spawn("./start-desktop.sh", {stdio: "inherit"})
		} else if (!opts.watch) {
			process.exit(0)
		}
	} catch (e) {
		console.error("Build failed", e)
		process.exit(1)
	}
}

