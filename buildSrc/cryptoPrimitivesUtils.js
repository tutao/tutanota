import fs from "fs-extra"

export const WASM_PACK_OUT_DIR = "packages/tutanota-crypto/lib/encryption/ed25519wasm"
export const CRYPTO_PRIMITIVES_CRATE = "tuta-sdk/rust/crypto-primitives"

export const CRYPTO_PRIMITIVES_WASM_FILE = "crypto_primitives_bg.wasm"

/**
 *
 * @param {{ wasmOutputDir: string, pathSourcePrefix?: string }} options
 */
export async function copyCryptoPrimitiveCrateIntoWasmDir({ wasmOutputDir, pathSourcePrefix }) {
	// prepare output dir that will contain our wasm files
	// this is necessary anyway because there is a race condition on the wasmloader plugin and the crypto-primitive wasm plugin
	// one assuming the folder already created by the other
	// createOutputFolderStructure(wasmOutputDir)
	if (!fs.existsSync(wasmOutputDir)) {
		fs.mkdirSync(wasmOutputDir, { recursive: true })
	}
	const prefix = pathSourcePrefix || ""
	const cryptoPrimitivesWasmFile = `${prefix}${WASM_PACK_OUT_DIR}/${CRYPTO_PRIMITIVES_WASM_FILE}`
	await fs.copyFile(cryptoPrimitivesWasmFile, `${wasmOutputDir}/${CRYPTO_PRIMITIVES_WASM_FILE}`)
}
