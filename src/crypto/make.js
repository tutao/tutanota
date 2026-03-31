import { program } from "commander"
import { $, usePowerShell } from "zx"
import path from "node:path"
import fs from "fs-extra"

const CRYPTO_PRIMITIVES_CRATE = "../../tuta-sdk/rust/crypto-primitives"
const WASM_PACK_OUT_DIR = "src/crypto-primitives"
export const CRYPTO_PRIMITIVES_WASM_FILE = "crypto_primitives_bg.wasm"

program
	.argument("targetDir", "Absolute path to build directory where wasm file should be copied to")
	.option("--clean, -c", "Clean the directory instead of building")
	.action(run)
	.parse(process.argv)

async function run(targetDir, { clean }) {
	if (process.platform === "win32") {
		usePowerShell()
	}

	const cryptoPrimitivesWasmFile = path.resolve(`../../${WASM_PACK_OUT_DIR}/${CRYPTO_PRIMITIVES_WASM_FILE}`)
	const cryptoPrimitivesWasmFileParsed = path.parse(cryptoPrimitivesWasmFile)
	const targetPath = path.resolve(`${targetDir}/${CRYPTO_PRIMITIVES_WASM_FILE}`)

	if (clean) {
		fs.rmSync(cryptoPrimitivesWasmFileParsed.dir, { recursive: true, force: true })
	}

	// prepare output dir that will contain our wasm files
	// this is necessary anyway because there is a race condition on the wasmloader plugin and the crypto-primitive wasm plugin
	// one assuming the folder already created by the other
	// createOutputFolderStructure(wasmOutputDir)
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true })
	}

	// note: --out-dir is relative to the rust package in `tuta-sdk/rust/crypto_primitives` (CRYPTO_PRIMITIVES_CRATE)
	const wasmOutDir = `../../../${WASM_PACK_OUT_DIR}`

	// * we only want to build this again in case it does not exist yet.
	// because invocation of wasm-pack leads to generation (file write) and optimization with wasm-opt (file read)
	// which leads to problem when we invoke this from multiple parallel steps in CI
	// * pass --clean flag to force rebuilding
	if (!fs.existsSync(cryptoPrimitivesWasmFile)) {
		await $({ stdio: "inherit" })`npx wasm-pack build --target web --profile release-wasm ${CRYPTO_PRIMITIVES_CRATE} --out-dir ${wasmOutDir} --no-pack`
	} else {
		console.log("Crypto-primitives already seems to be built under: " + cryptoPrimitivesWasmFileParsed.dir)
	}
	console.log("Copying wasm from: " + cryptoPrimitivesWasmFile + " to: " + targetPath)
	fs.copyFileSync(cryptoPrimitivesWasmFile, targetPath)
}
