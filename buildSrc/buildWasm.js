import util from "node:util"
import { exec } from "node:child_process"
import path from "node:path"

export async function buildLibOqs(resolvedBuildDir) {
	const outputPath = path.join(resolvedBuildDir, "liboqs.wasm")
	const workingDir = process.cwd().endsWith("/admin") ? `${process.cwd()}/../../tutanota/libs/webassembly/` : `${process.cwd()}/libs/webassembly/`
	await runCommand("make -f Makefile_liboqs build", {
		workingDir: workingDir,
		env: { WASM: outputPath },
	})
}

export async function buildArgon2(resolvedBuildDir) {
	const outputPath = path.join(resolvedBuildDir, "argon2.wasm")
	const workingDir = process.cwd().endsWith("/admin") ? `${process.cwd()}/../../tutanota/libs/webassembly/` : `${process.cwd()}/libs/webassembly/`
	await runCommand("make -f Makefile_argon2 build", {
		workingDir: workingDir,
		env: { WASM: outputPath },
	})
}

// export interface WasmGeneratorOptions {
// 	workingDir?: string
// 	env?: Record<string, any>
// }
async function runCommand(command, options /*WasmGeneratorOptions*/) {
	const runner = util.promisify(exec)
	const promise = runner(`${command}`, {
		env: {
			...process.env,
			...options.env,
		},
		maxBuffer: Infinity,
		cwd: options.workingDir ?? process.cwd(),
	})
	promise.child.stdout?.on("data", (data) => {
		console.log("wasm build:", data)
	})
	promise.child.stderr?.on("data", (data) => {
		console.log("wasm build:", data)
	})
	await promise
}
