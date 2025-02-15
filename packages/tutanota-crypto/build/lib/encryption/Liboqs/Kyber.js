import { callWebAssemblyFunctionWithArguments, mutableSecureFree, secureFree } from "@tutao/tutanota-utils";
import { CryptoError } from "../../misc/CryptoError.js";
/**
 * Number of random bytes required for a Kyber operation
 */
export const KYBER_RAND_AMOUNT_OF_ENTROPY = 64;
const KYBER_ALGORITHM = "Kyber1024";
const KYBER_K = 4;
const KYBER_POLYBYTES = 384;
export const KYBER_POLYVECBYTES = KYBER_K * KYBER_POLYBYTES;
export const KYBER_SYMBYTES = 32;
const OQS_KEM_kyber_1024_length_public_key = 1568;
const OQS_KEM_kyber_1024_length_secret_key = 3168;
const OQS_KEM_kyber_1024_length_ciphertext = 1568;
const OQS_KEM_kyber_1024_length_shared_secret = 32;
/**
 * @returns a new random kyber key pair.
 */
export function generateKeyPair(kyberWasm, randomizer) {
    const OQS_KEM = createKem(kyberWasm);
    try {
        fillEntropyPool(kyberWasm, randomizer);
        const publicKey = new Uint8Array(OQS_KEM_kyber_1024_length_public_key);
        const privateKey = new Uint8Array(OQS_KEM_kyber_1024_length_secret_key);
        const result = callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_keypair, kyberWasm, OQS_KEM, mutableSecureFree(publicKey), mutableSecureFree(privateKey));
        if (result != 0) {
            throw new Error(`OQS_KEM_keypair returned ${result}`);
        }
        return {
            publicKey: { raw: publicKey },
            privateKey: { raw: privateKey },
        };
    }
    finally {
        freeKem(kyberWasm, OQS_KEM);
    }
}
/**
 * @param kyberWasm the WebAssembly/JsFallback module that implements our kyber primitives (liboqs)
 * @param publicKey the public key to encapsulate with
 * @param randomizer our randomizer that is used to the native library with entropy
 * @return the plaintext secret key and the encapsulated key for use with AES or as input to a KDF
 */
export function encapsulate(kyberWasm, publicKey, randomizer) {
    if (publicKey.raw.length != OQS_KEM_kyber_1024_length_public_key) {
        throw new CryptoError(`Invalid public key length; expected ${OQS_KEM_kyber_1024_length_public_key}, got ${publicKey.raw.length}`);
    }
    const OQS_KEM = createKem(kyberWasm);
    try {
        fillEntropyPool(kyberWasm, randomizer);
        const ciphertext = new Uint8Array(OQS_KEM_kyber_1024_length_ciphertext);
        const sharedSecret = new Uint8Array(OQS_KEM_kyber_1024_length_shared_secret);
        const result = callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_encaps, kyberWasm, OQS_KEM, mutableSecureFree(ciphertext), mutableSecureFree(sharedSecret), mutableSecureFree(publicKey.raw));
        if (result != 0) {
            throw new Error(`OQS_KEM_encaps returned ${result}`);
        }
        return { ciphertext, sharedSecret };
    }
    finally {
        freeKem(kyberWasm, OQS_KEM);
    }
}
/**
 * @param kyberWasm the WebAssembly/JsFallback module that implements our kyber primitives (liboqs)
 * @param privateKey      the corresponding private key of the public key with which the encapsulatedKey was encapsulated with
 * @param ciphertext the ciphertext output of encapsulate()
 * @return the plaintext secret key
 */
export function decapsulate(kyberWasm, privateKey, ciphertext) {
    if (privateKey.raw.length != OQS_KEM_kyber_1024_length_secret_key) {
        throw new CryptoError(`Invalid private key length; expected ${OQS_KEM_kyber_1024_length_secret_key}, got ${privateKey.raw.length}`);
    }
    if (ciphertext.length != OQS_KEM_kyber_1024_length_ciphertext) {
        throw new CryptoError(`Invalid ciphertext length; expected ${OQS_KEM_kyber_1024_length_ciphertext}, got ${ciphertext.length}`);
    }
    const OQS_KEM = createKem(kyberWasm);
    try {
        const sharedSecret = new Uint8Array(OQS_KEM_kyber_1024_length_shared_secret);
        const result = callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_decaps, kyberWasm, OQS_KEM, mutableSecureFree(sharedSecret), secureFree(ciphertext), secureFree(privateKey.raw));
        if (result != 0) {
            throw new Error(`OQS_KEM_decaps returned ${result}`);
        }
        return sharedSecret;
    }
    finally {
        freeKem(kyberWasm, OQS_KEM);
    }
}
function freeKem(kyberWasm, OQS_KEM) {
    callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_free, kyberWasm, OQS_KEM);
}
// The returned pointer needs to be freed once not needed anymore by the caller
function createKem(kyberWasm) {
    return callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_new, kyberWasm, KYBER_ALGORITHM);
}
// Add bytes externally to the random number generator
function fillEntropyPool(exports, randomizer) {
    const entropyAmount = randomizer.generateRandomData(KYBER_RAND_AMOUNT_OF_ENTROPY);
    const remaining = callWebAssemblyFunctionWithArguments(exports.TUTA_inject_entropy, exports, entropyAmount, entropyAmount.length);
    if (remaining < 0) {
        console.warn(`tried to copy too much entropy: overflowed with ${-remaining} bytes; fix RAND_AMOUNT_OF_ENTROPY/generateRandomData to silence this`);
    }
}
