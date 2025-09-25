import { Argument, Option, program } from "commander"
import { runDevBuild } from "./buildSrc/DevBuild.js"
import { spawn } from "node:child_process"
import { chalk } from "zx"

await program
	.usage("[options] [test|prod|local|host <url>]")
	.addArgument(new Argument("stage").choices(["test", "prod", "local", "localSecure", "host"]).default("local").argOptional())
	.addArgument(new Argument("host").argOptional())
	.addOption(new Option("-a, --app <type>", "app to build").choices(["mail", "calendar"]).default("mail"))
	.option("-c, --clean", "Clean build directory")
	.option("-d, --start-desktop", "Assemble & start desktop client")
	.option("--desktop-build-only", "Assemble desktop client without starting")
	.option("-v, --verbose", "activate verbose logging in desktop client")
	.option("-s, --serve", "Start a local server to serve the website")
	.option("--network-debugging", "activate network debugging, sending attributeNames and attributeIds in the json request/response payloads", false)
	.option("-D, --dev-tools", "Start the desktop client with DevTools open")
	.action(async (stage, host, options) => {
		if ((stage === "host" && host == null) || (stage !== "host" && host != null)) {
			program.outputHelp()
			process.exit(1)
		}

		if (stage === "localSecure") {
			stage = "host"
			host = "https://app.local.tuta.com:9000"
		}

		const { clean, watch, serve, startDesktop, desktopBuildOnly, app, networkDebugging, devTools } = options

		if (serve) {
			console.error("--serve is currently disabled, point any server to ./build directory instead or build desktop")
		}

		try {
			await runDevBuild({
				stage: stage ?? "local",
				host,
				clean,
				watch,
				serve,
				desktop: startDesktop || desktopBuildOnly,
				networkDebugging,
				app,
			})

			if (startDesktop) {
				const buildDir = app === "calendar" ? "build-calendar-app" : "build"
				const env = Object.assign({}, process.env, { ELECTRON_ENABLE_SECURITY_WARNINGS: "TRUE", ELECTRON_START_WITH_DEV_TOOLS: devTools })
				// we don't want to quit here because we want to keep piping output to our stdout.
				spawn("node_modules/.bin/electron", ["--inspect=5858", `./${buildDir}/`], {
					stdio: "inherit",
					env: options.verbose ? Object.assign({}, env, { ELECTRON_ENABLE_LOGGING: 1 }) : env,
				})
			} else if (!watch) {
				// Don't wait for spawned child processes to exit (because they never will)
				process.exit(0)
			}
		} catch (e) {
			console.error(chalk.red.underline("Build failed:"), e)
			process.exit(1)
		}
	})
	.parseAsync(process.argv)
