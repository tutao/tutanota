import { KyberEncapsulation, KyberKeyPair, KyberPrivateKey, KyberPublicKey } from "./KyberKeyPair.js"
import { callWebAssemblyFunctionWithArguments, mutableSecureFree, Ptr, secureFree } from "@tutao/tutanota-utils"
import { Randomizer } from "../../random/Randomizer.js"
import { CryptoError } from "../../misc/CryptoError.js"
import { WASMExports } from "@tutao/tutanota-utils/dist/WebAssembly.js"

/**
 * Number of random bytes required for a Kyber operation
 */
export const ML_KEM_RAND_AMOUNT_OF_ENTROPY = 64

const ML_KEM_1024_ALGORITHM = "ML-KEM-1024"
const KYBER_K = 4
const KYBER_POLYBYTES = 384
export const KYBER_POLYVECBYTES = KYBER_K * KYBER_POLYBYTES
export const KYBER_SYMBYTES = 32
const OQS_KEM_ml_kem_1024_length_public_key = 1568
const OQS_KEM_ml_kem_1024_length_secret_key = 3168
const OQS_KEM_ml_kem_1024_length_ciphertext = 1568
const OQS_KEM_ml_kem_1024_length_shared_secret = 32

type KemPtr = Ptr

export interface LibOQSExports extends WASMExports {
	OQS_KEM_keypair(kem: KemPtr, publicKey: Ptr, secretKey: Ptr): number

	TUTA_inject_entropy(data: Ptr, size: number): number

	TUTA_KEM_encaps(kem: KemPtr, ciphertext: Ptr, sharedSecret: Ptr, publicKey: Ptr): number

	TUTA_KEM_decaps(kem: KemPtr, shared_secret: Ptr, ciphertext: Ptr, secret_key: Ptr): number

	OQS_KEM_free(kem: KemPtr | null): void

	OQS_KEM_new(methodName: Ptr): Ptr
}

/**
 * @returns a new random kyber key pair.
 */
export function generateKeyPair(kyberWasm: LibOQSExports, randomizer: Randomizer): KyberKeyPair {
	const OQS_KEM = createKem(kyberWasm)
	try {
		fillEntropyPool(kyberWasm, randomizer)
		const publicKey = new Uint8Array(OQS_KEM_ml_kem_1024_length_public_key)
		const privateKey = new Uint8Array(OQS_KEM_ml_kem_1024_length_secret_key)
		const result = callWebAssemblyFunctionWithArguments(
			kyberWasm.OQS_KEM_keypair,
			kyberWasm,
			OQS_KEM,
			mutableSecureFree(publicKey),
			mutableSecureFree(privateKey),
		)
		if (result !== 0) {
			throw new Error(`OQS_KEM_keypair returned ${result}`)
		}
		return {
			publicKey: { raw: publicKey },
			privateKey: { raw: privateKey },
		}
	} finally {
		freeKem(kyberWasm, OQS_KEM)
	}
}

/**
 * @param kyberWasm the WebAssembly/JsFallback module that implements our kyber primitives (liboqs)
 * @param publicKey the public key to encapsulate with
 * @param randomizer our randomizer that is used to the native library with entropy
 * @return the plaintext secret key and the encapsulated key for use with AES or as input to a KDF
 */
export function encapsulate(kyberWasm: LibOQSExports, publicKey: KyberPublicKey, randomizer: Randomizer): KyberEncapsulation {
	if (publicKey.raw.length !== OQS_KEM_ml_kem_1024_length_public_key) {
		throw new CryptoError(`Invalid public key length; expected ${OQS_KEM_ml_kem_1024_length_public_key}, got ${publicKey.raw.length}`)
	}

	const OQS_KEM = createKem(kyberWasm)
	try {
		fillEntropyPool(kyberWasm, randomizer)
		const ciphertext = new Uint8Array(OQS_KEM_ml_kem_1024_length_ciphertext)
		const sharedSecret = new Uint8Array(OQS_KEM_ml_kem_1024_length_shared_secret)
		const result = callWebAssemblyFunctionWithArguments(
			kyberWasm.TUTA_KEM_encaps,
			kyberWasm,
			OQS_KEM,
			mutableSecureFree(ciphertext),
			mutableSecureFree(sharedSecret),
			mutableSecureFree(publicKey.raw),
		)
		if (result !== 0) {
			throw new Error(`TUTA_KEM_encaps returned ${result}`)
		}
		return { ciphertext, sharedSecret }
	} finally {
		freeKem(kyberWasm, OQS_KEM)
	}
}

/**
 * @param kyberWasm the WebAssembly/JsFallback module that implements our kyber primitives (liboqs)
 * @param privateKey      the corresponding private key of the public key with which the encapsulatedKey was encapsulated with
 * @param ciphertext the ciphertext output of encapsulate()
 * @return the plaintext secret key
 */
export function decapsulate(kyberWasm: LibOQSExports, privateKey: KyberPrivateKey, ciphertext: Uint8Array): Uint8Array {
	if (privateKey.raw.length !== OQS_KEM_ml_kem_1024_length_secret_key) {
		throw new CryptoError(`Invalid private key length; expected ${OQS_KEM_ml_kem_1024_length_secret_key}, got ${privateKey.raw.length}`)
	}
	if (ciphertext.length !== OQS_KEM_ml_kem_1024_length_ciphertext) {
		throw new CryptoError(`Invalid ciphertext length; expected ${OQS_KEM_ml_kem_1024_length_ciphertext}, got ${ciphertext.length}`)
	}

	const OQS_KEM = createKem(kyberWasm)
	try {
		const sharedSecret = new Uint8Array(OQS_KEM_ml_kem_1024_length_shared_secret)
		const result = callWebAssemblyFunctionWithArguments(
			kyberWasm.TUTA_KEM_decaps,
			kyberWasm,
			OQS_KEM,
			mutableSecureFree(sharedSecret),
			secureFree(ciphertext),
			secureFree(privateKey.raw),
		)
		if (result !== 0) {
			throw new Error(`TUTA_KEM_decaps returned ${result}`)
		}
		return sharedSecret
	} finally {
		freeKem(kyberWasm, OQS_KEM)
	}
}

function freeKem(kyberWasm: LibOQSExports, OQS_KEM: KemPtr) {
	callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_free, kyberWasm, OQS_KEM)
}

// The returned pointer needs to be freed once not needed anymore by the caller
function createKem(kyberWasm: LibOQSExports): KemPtr {
	return callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_new, kyberWasm, ML_KEM_1024_ALGORITHM)
}

// Add bytes externally to the random number generator
function fillEntropyPool(exports: LibOQSExports, randomizer: Randomizer) {
	const entropyAmount = randomizer.generateRandomData(ML_KEM_RAND_AMOUNT_OF_ENTROPY)
	const remaining = callWebAssemblyFunctionWithArguments(exports.TUTA_inject_entropy, exports, entropyAmount, entropyAmount.length)
	if (remaining < 0) {
		console.warn(`tried to copy too much entropy: overflowed with ${-remaining} bytes; fix RAND_AMOUNT_OF_ENTROPY/generateRandomData to silence this`)
	}
}
