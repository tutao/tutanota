import { program } from "commander"
import { CRYPTO_PRIMITIVES_CRATE, WASM_PACK_OUT_DIR } from "../../buildSrc/cryptoPrimitivesUtils.js"
import { sh } from "../../buildSrc/sh.js"

await program.usage("").action(run).parseAsync(process.argv)

async function run() {
	await sh`wasm-pack build --dev --target web ../../${CRYPTO_PRIMITIVES_CRATE} --out-dir ../../../${WASM_PACK_OUT_DIR}`
}
