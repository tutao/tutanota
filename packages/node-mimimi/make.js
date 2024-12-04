import { Argument, program } from "commander"
import { $ } from "zx"

await program
	.usage("[options] [win|linux|darwin|native]")
	.addArgument(new Argument("platform").choices(["win", "linux", "darwin", "native"]).default("native").argOptional())
	.option("-c, --clean", "clean build artifacts")
	.option("-r, --release", "run a release build")
	.action(run)
	.parseAsync(process.argv)

function getTarget(platform) {
	switch (platform) {
		case "win":
			return "--target=x86_64-pc-windows-msvc"
		case "linux":
			return "--target=x86_64-unknown-linux-gnu"
		case "darwin":
			return "--target=x86_64-apple-darwin"
		case "native":
			return ""
		default:
			throw new Error(`unknown platform ${platform}`)
	}
}

async function run(platform, { clean, release }) {
	if (clean) {
		await $`rm -r -f ./build`
		await $`rm -r -f ./target`
		await $`rm -r -f ./dist`
	}

	const target = getTarget(platform)
	const releaseFlag = release ? "--release" : ""
	await $`napi build dist --platform --js binding.cjs --dts binding.d.cts ${target} ${releaseFlag} --features javascript`
}
