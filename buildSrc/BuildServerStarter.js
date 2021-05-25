/**
 * The code below can be used to start a build server instance via the commandline.
 * Example: node BuildServer.js start -d build Builder.js
 */
import options from "commander"
import {BuildServer} from "./BuildServer.js"

options
	.arguments('<builderPath>')
	.option('-d --directory <directory>', 'Directory in which to create log files, sockets, etc.')
	.option('-p --devServer-port <port>', 'Port (on localhost) on which to launch a devServer')
	.option('-w --watch <watchFoldersString>', 'Colon seperated list of foldes to watch for source code changes')
	.option('-P --preserve-logs', 'If set, log files will not be deleted on shutdown')
	.option('-s --single-page', 'If set, a redirect will be used by the devServer redirecting any request to /?r=<requestedUrl>')
	.option('-r --web-root <webRootDirectory>', 'Absolute path to directory that should be used as web root by the devServer')
	.action((builderPath) => {
		startBuildServer({...options.opts(), builderPath})
	})
	.parse(process.argv)

async function startBuildServer(opts) {
	if (opts.watch) {
		opts.watchFolders = opts.watch.split(":")
	} else {
		opts.watchFolders = []
	}

	const buildServer = new BuildServer(opts)
	process.on("SIGINT", () => {
		// IDEs tend to send SIGINT to all child processes but we want to keep running
		buildServer.log("SIGINT received, ignoring")
	})
	process.on("uncaughtException", (e) => {
		buildServer.log("Uncaught exception: ", e)
	})
	process.on("SIGTERM", async () => {
		buildServer.log("SIGTERM received, stopping")
		await buildServer.stop().then(
			process.exit(1)
		)
	})

	await buildServer.start().catch((e) => {
		console.log("Failed to run server", e)
		process.exit(1)
	})
}