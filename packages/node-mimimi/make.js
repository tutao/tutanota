import { Argument, program } from "commander"
import { $, cd, usePowerShell } from "zx"
import path from "node:path"

await program
	.usage("[options] [win|linux|darwin|native]")
	.addArgument(new Argument("platform").choices(["win", "linux", "darwin", "native"]).default("native").argOptional())
	.option("-c, --clean", "clean build artifacts")
	.option("-r, --release", "run a release build")
	.option("--greenmail", "also run the greenmail build")
	.action(run)
	.parseAsync(process.argv)

function getTarget(platform) {
	switch (platform) {
		case "win":
		case "win32":
			usePowerShell()
			return ["--target=x86_64-pc-windows-msvc"]
		case "linux":
			return ["--target=x86_64-unknown-linux-gnu"]
		case "darwin":
			return ["--target=x86_64-apple-darwin", "--target=aarch64-apple-darwin"]
		case "native":
			return getTarget(process.platform)
		default:
			throw new Error(`unknown platform ${platform}`)
	}
}

async function run(platform, { clean, release, greenmail }) {
	if (clean) {
		await fs.promises.rm("./build", { recursive: true, force: true })
		await fs.promises.rm("./target", { recursive: true, force: true })
		await fs.promises.rm("./dist", { recursive: true, force: true })
	}

	if (greenmail) {
		cd(path.join(import.meta.url, "java"))
		await $`/opt/gradle-8.5/bin/gradle jar`
		cd("..")
	}

	const targets = getTarget(platform)

	const releaseFlag = release ? "--release" : ""
	for (const target of targets) {
		await $`npx napi build dist --platform --js binding.cjs  --dts binding.d.cts ${target} ${releaseFlag} --features javascript`
	}
}
