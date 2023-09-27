import { concat, Hex, hexToUint8Array, LazyLoaded, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { NativeCryptoFacade } from "../../../native/common/generatedipc/NativeCryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import {
	CryptoError,
	decapsulateKyber,
	encapsulateKyber,
	generateKeyPairKyber,
	KYBER_POLYVECBYTES,
	KYBER_RAND_AMOUNT_OF_ENTROPY,
	KYBER_SYMBYTES,
	KyberEncapsulation,
	KyberKeyPair,
	KyberPrivateKey,
	KyberPublicKey,
	random,
} from "@tutao/tutanota-crypto"

assertWorkerOrNode()

/**
 * Abstract interface for the Liboqs crypto system.
 */
export interface KyberFacade {
	/**
	 * Generate a key new random key pair
	 */
	generateKeypair(): Promise<KyberKeyPair>

	/**
	 *
	 * @param publicKey the public key to encapsulate the secret with
	 * @returns the ciphertext and the shared secret
	 */
	encapsulate(publicKey: KyberPublicKey): Promise<KyberEncapsulation>

	/**
	 *
	 * @param privateKey the corresponding private key to the public key used to encapsulate the cipher text
	 * @param ciphertext the encapsulated ciphertext
	 * @returns the shared secret
	 */
	decapsulate(privateKey: KyberPrivateKey, ciphertext: Uint8Array): Promise<Uint8Array>
}

/**
 * WebAssembly implementation of Liboqs
 */
export class WASMKyberFacade implements KyberFacade {
	constructor(private readonly testWASM?: WebAssembly.Exports) {}

	// loads liboqs WASM
	private liboqs: LazyLoaded<WebAssembly.Exports> = new LazyLoaded(async () => {
		if (this.testWASM) {
			return this.testWASM
		}
		const wasm = fetch("wasm/liboqs.wasm")
		if (WebAssembly.instantiateStreaming) {
			return (await WebAssembly.instantiateStreaming(wasm)).instance.exports
		} else {
			// Fallback if the client does not support instantiateStreaming
			const buffer = await (await wasm).arrayBuffer()
			return (await WebAssembly.instantiate(buffer)).instance.exports
		}
	})

	async generateKeypair(): Promise<KyberKeyPair> {
		return generateKeyPairKyber(await this.liboqs.getAsync(), random)
	}

	async encapsulate(publicKey: KyberPublicKey): Promise<KyberEncapsulation> {
		return encapsulateKyber(await this.liboqs.getAsync(), publicKey, random)
	}

	async decapsulate(privateKey: KyberPrivateKey, ciphertext: Uint8Array): Promise<Uint8Array> {
		return decapsulateKyber(await this.liboqs.getAsync(), privateKey, ciphertext)
	}
}

/**
 * Native implementation of Liboqs
 */
export class NativeKyberFacade implements KyberFacade {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade) {}

	generateKeypair(): Promise<KyberKeyPair> {
		return this.nativeCryptoFacade.generateKyberKeypair(random.generateRandomData(KYBER_RAND_AMOUNT_OF_ENTROPY))
	}

	encapsulate(publicKey: KyberPublicKey): Promise<KyberEncapsulation> {
		return this.nativeCryptoFacade.kyberEncapsulate(publicKey, random.generateRandomData(KYBER_RAND_AMOUNT_OF_ENTROPY))
	}

	decapsulate(privateKey: KyberPrivateKey, ciphertext: Uint8Array): Promise<Uint8Array> {
		return this.nativeCryptoFacade.kyberDecapsulate(privateKey, ciphertext)
	}
}

export function kyberPrivateKeyToHex(key: KyberPrivateKey): Hex {
	const keyBytes = key.raw
	//liboqs: s, t, rho, hpk, nonce
	//encoded: s, hpk, nonce, t, rho
	const s = keyBytes.slice(0, KYBER_POLYVECBYTES)
	const t = keyBytes.slice(KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES)
	const rho = keyBytes.slice(2 * KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES)
	const hpk = keyBytes.slice(2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES)
	const nonce = keyBytes.slice(2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 3 * KYBER_SYMBYTES)
	return formatHexString([s, hpk, nonce, t, rho])
}

export function kyberPublicKeyToHex(key: KyberPublicKey): Hex {
	const keyComponents: Uint8Array[] = []
	const keyBytes = key.raw
	keyComponents.push(keyBytes.slice(0, KYBER_POLYVECBYTES))
	keyComponents.push(keyBytes.slice(KYBER_POLYVECBYTES, KYBER_POLYVECBYTES + KYBER_SYMBYTES))
	return formatHexString(keyComponents)
}

function formatHexString(keyComponent: Uint8Array[]): Hex {
	let result = ""
	for (const comp of keyComponent) {
		const hex = uint8ArrayToHex(comp)
		result += getHexLen(hex) + hex
	}
	return result
}

function getHexLen(data: Hex): Hex {
	let hexLen = data.length.toString(16)
	while (hexLen.length < 4) {
		hexLen = "0" + hexLen
	}
	return hexLen
}

export function hexToKyberPublicKey(hex: Hex): KyberPublicKey {
	const keyComponents = _hexToKyberKeyArray(hex)
	if (keyComponents.length != 2) {
		throw new Error("invalid public key hex encoding")
	}
	// key is expected by oqs in the same order t, rho
	return { raw: concat(...keyComponents) }
}

export function hexToKyberPrivateKey(hex: Hex): KyberPrivateKey {
	const keyComponents = _hexToKyberKeyArray(hex)
	if (keyComponents.length != 5) {
		throw new Error("invalid private key hex encoding")
	}

	// key is expected by oqs in this order (vs how we encode it on the server): s, t, rho, hpk, nonce
	return { raw: concat(keyComponents[0], keyComponents[3], keyComponents[4], keyComponents[1], keyComponents[2]) }
}

function _hexToKyberKeyArray(hex: Hex): Uint8Array[] {
	try {
		var key: Uint8Array[] = []
		var pos = 0

		while (pos < hex.length) {
			var nextParamLen = parseInt(hex.substring(pos, pos + 4), 16)
			pos += 4
			key.push(hexToUint8Array(hex.substring(pos, pos + nextParamLen)))
			pos += nextParamLen
		}

		return key
	} catch (e) {
		throw new CryptoError("hex to kyber key failed", e as Error)
	}
}
