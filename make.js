import { Argument, Option, program } from "commander"
import { runDevBuild } from "./buildSrc/DevBuild.js"
import { spawn } from "node:child_process"
import { chalk } from "zx"

await program
	.usage("[options] [test|prod|local|host <url>]")
	.addArgument(new Argument("stage").choices(["test", "prod", "local", "host"]).default("local").argOptional())
	.addArgument(new Argument("host").argOptional())
	.addOption(new Option("-a, --app <type>", "app to build").choices(["mail", "calendar"]).default("mail"))
	.option("-c, --clean", "Clean build directory")
	.option("-d, --desktop", "Assemble & start desktop client")
	.option("-v, --verbose", "activate verbose loggin in desktop client")
	.option("-s, --serve", "Start a local server to serve the website")
	.option("--ignore-migrations", "Dont check offline database migrations.")
	.action(async (stage, host, options) => {
		if ((stage === "host" && host == null) || (stage !== "host" && host != null)) {
			program.outputHelp()
			process.exit(1)
		}

		const { clean, watch, serve, desktop, ignoreMigrations, app } = options

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
				desktop,
				ignoreMigrations,
				app,
			})

			if (desktop) {
				const buildDir = app === "calendar" ? "build-calendar-app" : "build"
				const env = Object.assign({}, process.env, { ELECTRON_ENABLE_SECURITY_WARNINGS: "TRUE" })
				// we don't want to quit here because we want to keep piping output to our stdout.
				spawn("npx", [`electron --inspect=5858 ./${buildDir}/`], {
					shell: true,
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
