import { Aes256Key } from "../../encryption/Aes.js"
import { zeroOut, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { uint8ArrayToBitArray } from "../../misc/Utils.js"

// Per OWASP's recommendations @ https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
export const ARGON2ID_ITERATIONS = 4
export const ARGON2ID_MEMORY_IN_KiB = 32 * 1024
export const ARGON2ID_PARALLELISM = 1
export const ARGON2ID_KEY_LENGTH = 32

/**
 * Create a 256-bit symmetric key from the given passphrase.
 * @param argon2 argon2 module exports
 * @param pass The passphrase to use for key generation as utf8 string.
 * @param salt 16 bytes of random data
 * @return resolved with the key
 */
export function generateKeyFromPassphrase(argon2: WebAssembly.Exports, pass: string, salt: Uint8Array): Aes256Key {
	const hash = argon2idHashRaw(
		argon2,
		ARGON2ID_ITERATIONS,
		ARGON2ID_MEMORY_IN_KiB,
		ARGON2ID_PARALLELISM,
		stringToUtf8Uint8Array(pass),
		salt,
		ARGON2ID_KEY_LENGTH,
	)
	return uint8ArrayToBitArray(hash)
}

type Ptr = number
type ConstVoidPtr = Ptr
type VoidPtr = Ptr

type FreeFN = (what: Ptr) => void
type MallocFN = (len: number) => Ptr
type Argon2IDHashRawFN = (
	t_cost: number,
	m_cost: number,
	parallelism: number,
	pwd: ConstVoidPtr,
	pwdlen: number,
	salt: ConstVoidPtr,
	saltlen: number,
	hash: VoidPtr,
	hashlen: number,
) => number

function isNull(array: Uint8Array): boolean {
	return array.byteOffset === 0
}

function argon2idHashRaw(
	argon2: WebAssembly.Exports,
	timeCost: number,
	memoryCost: number,
	parallelism: number,
	password: Uint8Array,
	salt: Uint8Array,
	hashLength: number,
): Uint8Array {
	const memory: WebAssembly.Memory = argon2.memory as WebAssembly.Memory
	const free = argon2.free as FreeFN
	const malloc = argon2.malloc as MallocFN
	const argon2id_hash_raw = argon2.argon2id_hash_raw as Argon2IDHashRawFN

	// Perform allocations (we have to allocate memory in the argon2 module's heap to pass values, as it can't access memory outside of it)
	const hashBuf = new Uint8Array(memory.buffer, malloc(hashLength), hashLength)
	const saltBuf = new Uint8Array(memory.buffer, malloc(salt.length), salt.length)
	const pwdBuf = new Uint8Array(memory.buffer, malloc(password.length), password.length)

	try {
		// Check if allocations were successful (note that free(NULL) is a no-op if we hit the `finally` block)
		if (isNull(hashBuf) || isNull(saltBuf) || isNull(pwdBuf)) {
			throw new Error("argon2id malloc failure")
		}

		// Copy in the salt and password
		saltBuf.set(salt)
		pwdBuf.set(password)

		// Hash. Nonzero return value is an error.
		const result = argon2id_hash_raw(
			timeCost,
			memoryCost,
			parallelism,
			pwdBuf.byteOffset,
			pwdBuf.length,
			saltBuf.byteOffset,
			saltBuf.length,
			hashBuf.byteOffset,
			hashBuf.length,
		)
		if (result !== 0) {
			// If you hit this, refer to argon.h (look for Argon2_ErrorCodes) for a description of what it means. It's likely an issue with one of your inputs.
			//
			// Note: If you got ARGON2_MEMORY_ALLOCATION_ERROR (-22), you probably gave too big of a memory cost. You need to recompile argon2.wasm to support more memory.
			throw new Error(`argon2id_hash_raw returned ${result}`)
		}

		// Make a permanent copy of the final hash and return it, since our malloc'd buffer is only temporary
		const finalHash = new Uint8Array(hashBuf.length)
		finalHash.set(hashBuf)
		return finalHash
	} finally {
		// We should clear this, as the VM will otherwise remain in memory when we want to use it again, and we don't want a lingering password here.
		if (!isNull(pwdBuf)) {
			zeroOut(pwdBuf)
		}

		// We also do not want to have the hash linger, either, as you can use it to derive a verifier as well as use it for decryption, thus it's secret as well.
		if (!isNull(hashBuf)) {
			zeroOut(hashBuf)
		}

		// Free allocations (prevent memory leakage as we may re-use this argon)
		free(pwdBuf.byteOffset)
		free(saltBuf.byteOffset)
		free(hashBuf.byteOffset)
	}
}
