import fs from "fs-extra"

export const WASM_PACK_OUT_DIR = "packages/tutanota-crypto/lib/encryption/ed25519wasm"
export const CRYPTO_PRIMITIVES_CRATE = "tuta-sdk/rust/crypto-primitives"

export const CRYPTO_PRIMITIVES_WASM_FILE = "crypto_primitives_bg.wasm"

export async function copyCryptoPrimitiveCrateIntoWasmDir({ wasmOutputDir }) {
	// prepare output dir that will contain our wasm files
	// this is necessary anyway because there is a race condition on the wasmloader plugin and the crypto-primitive wasm plugin
	// one assuming the folder already created by the other
	// createOutputFolderStructure(wasmOutputDir)
	if (!fs.existsSync(wasmOutputDir)) {
		fs.mkdirSync(wasmOutputDir, { recursive: true })
	}
	const cryptoPrimitivesWasmFile = `${WASM_PACK_OUT_DIR}/${CRYPTO_PRIMITIVES_WASM_FILE}`
	await fs.copyFile(cryptoPrimitivesWasmFile, `${wasmOutputDir}/${CRYPTO_PRIMITIVES_WASM_FILE}`)
}
