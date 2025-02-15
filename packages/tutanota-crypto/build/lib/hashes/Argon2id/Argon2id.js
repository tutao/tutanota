import { callWebAssemblyFunctionWithArguments, mutableSecureFree, secureFree, stringToUtf8Uint8Array } from "@tutao/tutanota-utils";
import { uint8ArrayToBitArray } from "../../misc/Utils.js";
// Per OWASP's recommendations @ https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
export const ARGON2ID_ITERATIONS = 4;
export const ARGON2ID_MEMORY_IN_KiB = 32 * 1024;
export const ARGON2ID_PARALLELISM = 1;
export const ARGON2ID_KEY_LENGTH = 32;
/**
 * Create a 256-bit symmetric key from the given passphrase.
 * @param argon2 argon2 module exports
 * @param pass The passphrase to use for key generation as utf8 string.
 * @param salt 16 bytes of random data
 * @return resolved with the key
 */
export async function generateKeyFromPassphrase(argon2, pass, salt) {
    const hash = await argon2idHashRaw(argon2, ARGON2ID_ITERATIONS, ARGON2ID_MEMORY_IN_KiB, ARGON2ID_PARALLELISM, stringToUtf8Uint8Array(pass), salt, ARGON2ID_KEY_LENGTH);
    return uint8ArrayToBitArray(hash);
}
async function argon2idHashRaw(argon2, timeCost, memoryCost, parallelism, password, salt, hashLength) {
    const hash = new Uint8Array(hashLength);
    const result = callWebAssemblyFunctionWithArguments(argon2.argon2id_hash_raw, argon2, timeCost, memoryCost, parallelism, secureFree(password), password.length, salt, salt.length, mutableSecureFree(hash), hash.length);
    if (result !== 0) {
        // If you hit this, refer to argon.h (look for Argon2_ErrorCodes) for a description of what it means. It's likely an issue with one of your inputs.
        //
        // Note: If you got ARGON2_MEMORY_ALLOCATION_ERROR (-22), you probably gave too big of a memory cost. You need to recompile argon2.wasm to support more memory.
        throw new Error(`argon2id_hash_raw returned ${result}`);
    }
    return hash;
}
