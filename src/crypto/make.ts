import { Option, program } from "commander"
import { $, usePowerShell } from "zx"
import fs from "node:fs"
import path from "node:path"

const CRYPTO_PRIMITIVES_CRATE = "../../tuta-sdk/rust/crypto-primitives"
const WASM_PACK_OUT_DIR = "../../src/crypto-primitives"
export const CRYPTO_PRIMITIVES_WASM_FILE = "crypto_primitives_bg.wasm"

const AVAILABLE_PROFILES = ["release", "test"] as const
type AvailableProfile = (typeof AVAILABLE_PROFILES)[number]

program.addOption(new Option("-p, --profile <type>").choices(AVAILABLE_PROFILES).default("release")).action(run).parse(process.argv)

async function run(options: { profile: AvailableProfile }) {
	if (process.platform === "win32") {
		usePowerShell()
	}

	// note: --out-dir is relative to the rust package in `tuta-sdk/rust/crypto_primitives` (CRYPTO_PRIMITIVES_CRATE)
	await $`npx wasm-pack build --target web --profile release-wasm ${CRYPTO_PRIMITIVES_CRATE} --out-dir ${WASM_PACK_OUT_DIR}`

	if (options.profile === "release") {
		await copyCryptoPrimitiveCrateIntoWasmDir("../../build")
		await copyCryptoPrimitiveCrateIntoWasmDir("../../build-calendar-app")
	} else if (options.profile === "test") {
		await copyCryptoPrimitiveCrateIntoWasmDir("../../test/build")
	}
}

export async function copyCryptoPrimitiveCrateIntoWasmDir(wasmOutputDir: string) {
	// prepare output dir that will contain our wasm files
	// this is necessary anyway because there is a race condition on the wasmloader plugin and the crypto-primitive wasm plugin
	// one assuming the folder already created by the other
	// createOutputFolderStructure(wasmOutputDir)
	if (!fs.existsSync(wasmOutputDir)) {
		fs.mkdirSync(wasmOutputDir, { recursive: true })
	}
	const cryptoPrimitivesWasmFile = path.resolve(`${WASM_PACK_OUT_DIR}/${CRYPTO_PRIMITIVES_WASM_FILE}`)
	const targetPath = path.resolve(`${wasmOutputDir}/${CRYPTO_PRIMITIVES_WASM_FILE}`)
	fs.copyFileSync(cryptoPrimitivesWasmFile, targetPath)
}
