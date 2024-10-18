import { Argument, program } from "commander"
import { $ } from "zx"

await program
	.usage("[options] [win|linux|darwin|native]")
	.addArgument(new Argument("platform").choices(["win", "linux", "darwin", "native"]).default("native").argOptional())
	.option("-c, --clean", "clean build artifacts")
	.option("-r, --release", "run a release build")
	.option("-t, --test", "also build the test suite")
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

async function run(platform, { clean, release, test }) {
	if (clean) {
		$`rm -r -f ./build`
		$`rm -r -f ./target`
		$`rm -r -f ./dist`
	}

	const target = getTarget(platform)
	const releaseFlag = release ? "--release" : ""
	await $`napi build --platform dist --js binding.cjs --dts binding.d.ts ${target} ${releaseFlag}`
	if (test) {
		await $`tsc -b test`
	}
}
