import { program } from "commander"
import { CRYPTO_PRIMITIVES_CRATE, WASM_PACK_OUT_DIR } from "../../buildSrc/cryptoPrimitivesUtils.js"
import { $, usePowerShell } from "zx"

await program.usage("").action(run).parseAsync(process.argv)

async function run() {
	if (process.platform === "win32") {
		usePowerShell()
	}
	await $`npx wasm-pack build --target web ../../${CRYPTO_PRIMITIVES_CRATE} --out-dir ../../../${WASM_PACK_OUT_DIR}`
}
