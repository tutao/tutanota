import { Argument, program } from "commander"
import { usePowerShell } from "zx"
import { rm } from "node:fs/promises"
import { NapiCli } from "@napi-rs/cli"

await program
	.usage("[options] [win|linux|darwin|native]")
	.addArgument(new Argument("platform").choices(["win", "linux", "darwin", "native"]).default("native").argOptional())
	.option("-c, --clean", "clean build artifacts")
	.option("-r, --release", "run a release build")
	.action(run)
	.parseAsync(process.argv)

/**
 * @param platform {string}
 * @return {string[]}
 */
function getTargets(platform) {
	switch (platform) {
		case "win":
		case "win32":
			usePowerShell()
			return ["x86_64-pc-windows-msvc"]
		case "linux":
			return ["x86_64-unknown-linux-gnu", "aarch64-unknown-linux-gnu"]
		case "darwin":
			return ["x86_64-apple-darwin", "aarch64-apple-darwin"]
		case "native":
			// Determine the actual hardware architecture for native builds
			const arch = process.arch
			if (process.platform === "linux") {
				if (arch === "arm64") {
					return ["aarch64-unknown-linux-gnu"]
				} else {
					return ["x86_64-unknown-linux-gnu"] // Default to x86_64 for other architectures on Linux
				}
			} else if (process.platform === "darwin") {
				if (arch === "arm64") {
					return ["aarch64-apple-darwin"]
				} else {
					return ["x86_64-apple-darwin"] // Default to x86_64 for other architectures on macOS
				}
			} else if (process.platform === "win32") {
				return ["x86_64-pc-windows-msvc"] // Windows typically uses x86_64
			}
			return getTargets(process.platform)
		default:
			throw new Error(`unknown platform ${platform}`)
	}
}

async function run(platform, { clean, release }) {
	if (clean) {
		await rm("./build", { recursive: true, force: true })
		await rm("./target", { recursive: true, force: true })
		await rm("./dist", { recursive: true, force: true })
	}

	const targets = getTargets(platform)

	for (const target of targets) {
		await new NapiCli().build({
			outputDir: "dist",
			platform: true,
			jsBinding: "binding.js",
			esm: true,
			dts: "binding.d.ts",
			target,
			release,
			features: ["javascript"],
			// Even though it is documented as defaulting to true it doesn't seem to actually be the case
			// https://github.com/napi-rs/napi-rs/issues/2419
			dtsCache: true,
		})
	}
}
