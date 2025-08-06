import { program } from "commander"
import { CRYPTO_PRIMITIVES_CRATE, WASM_PACK_OUT_DIR } from "../../buildSrc/cryptoPrimitivesUtils.js"
import { $, usePowerShell } from "zx"
import fs from "fs-extra"

await program.usage("").action(run).parseAsync(process.argv)

async function run() {
	if (process.platform === "win32") {
		usePowerShell()
	}
	// we only want to build this again in case it does not exist yet.
	// use node make clean to force rebuilding
	if (!fs.existsSync(`../../${WASM_PACK_OUT_DIR}`)) {
		await $`npx wasm-pack build --target web ../../${CRYPTO_PRIMITIVES_CRATE} --out-dir ../../../${WASM_PACK_OUT_DIR}`
	}
}
