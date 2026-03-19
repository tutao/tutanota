import { program } from "commander"
import { $, usePowerShell } from "zx"

const CRYPTO_PRIMITIVES_CRATE = "../../tuta-sdk/rust/crypto-primitives"
const WASM_PACK_OUT_DIR = "../../../src/crypto-primitives"

async function run() {
	if (process.platform === "win32") {
		usePowerShell()
	}

	// note: --out-dir is relative to the rust package in `tuta-sdk/rust/crypto_primitives` (CRYPTO_PRIMITIVES_CRATE)
	await $`npx wasm-pack build --target web --profile release-wasm ${CRYPTO_PRIMITIVES_CRATE} --out-dir ${WASM_PACK_OUT_DIR}`
}

await program.usage("").action(run).parseAsync(process.argv)
