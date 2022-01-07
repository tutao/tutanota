/**
 * The code below can be used to start a build server instance via the commandline.
 * Example: node BuildServer.js start -d build Builder.js
 */
import options from "commander"
import {BuildServer} from "./BuildServer.js"
import {BuildServerConfig} from "./BuildServerConfig.js"

options
		.arguments("<builderPath>")
		.option("-d --directory <directory>", "Directory in which to create log files, sockets, etc.")
		.option("-p --devServer-port <port>", "Port (on localhost) on which to launch a devServer")
		.option(
				"-w --watchFolders <watchFoldersString>",
				"Colon seperated list of folders to watch for source code changes",
		)
		.option("-P --preserve-logs", "If set, log files will not be deleted on shutdown")
		.option(
				"-s --spaRedirect",
				"If set, a redirect will be used by the devServer redirecting any request to /?r=<requestedUrl>",
		)
		.option(
				"-r --web-root <webRootDirectory>",
				"Absolute path to directory that should be used as web root by the devServer",
		)
		.option("-a --autoRebuild", "If set, changes to watched files trigger a rebuild")
		.action(builderPath => {
			const opts = options.opts()
			const buildServerConfig = new BuildServerConfig(
					builderPath,
					opts.watchFolders ? opts.watchFolders.split(":") : [],
					opts.devServerPort ?? null,
					opts.webRoot ?? null,
					opts.spaRedirect ?? null,
					opts.preserveLogs ?? null,
					opts.directory,
					opts.autoRebuild,
			)
			startBuildServer(buildServerConfig)
		})
		.parse(process.argv)

async function startBuildServer(buildServerConfig) {
	const buildServer = new BuildServer(buildServerConfig)
	process.on("SIGINT", () => {
		// IDEs tend to send SIGINT to all child processes but we want to keep running
		buildServer.log("SIGINT received, ignoring")
	})
	process.on("uncaughtException", e => {
		buildServer.log("Uncaught exception: ", e)
	})
	process.on("SIGTERM", async () => {
		buildServer.log("SIGTERM received, stopping")
		await buildServer.stop()
		process.exit(1)
	})

	try {
		await buildServer.start()
	} catch (e) {
		console.log("Failed to run build server: ", e)
		process.exit(1)
	}
}