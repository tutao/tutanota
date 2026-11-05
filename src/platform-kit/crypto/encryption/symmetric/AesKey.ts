import { CryptoError } from "@tutao/crypto/error"
import { VersionedAes256Key, VersionedKey } from "../../CryptoTypes"
import { lazyAsync, Nullable } from "@tutao/utils"

export type BitArray = number[]

export enum AesKeyLength {
	Aes128 = 128,
	Aes256 = 256,
}

export abstract class AesKeyOrSubKeys {}

export abstract class AesKey extends AesKeyOrSubKeys {
	abstract readonly bits: BitArray
	abstract readonly keyLength: AesKeyLength
}

export class Aes256Key extends AesKey {
	readonly keyLength = AesKeyLength.Aes256

	constructor(public readonly bits: BitArray) {
		// AesKey is an array of 4 byte numbers. therefore converting the length to bits means 4*8
		const keyLength: number = bits.length * 4 * 8
		if (keyLength !== AesKeyLength.Aes256) {
			throw new CryptoError(`invalid key length ${keyLength}`)
		}
		super()
	}
}

export class Aes128Key extends AesKey {
	readonly keyLength = AesKeyLength.Aes128

	constructor(public readonly bits: BitArray) {
		// AesKey is an array of 4 byte numbers. therefore converting the length to bits means 4*8
		const keyLength: number = bits.length * 4 * 8
		if (keyLength !== AesKeyLength.Aes128) {
			throw new CryptoError(`invalid key length ${keyLength}`)
		}
		super()
	}
}

export function getKeyLengthInBytes(keyLength: AesKeyLength): number {
	return keyLength / 8
}

export function assert256BitKey(key: AesKey): Aes256Key {
	if (key instanceof Aes256Key) {
		return key
	} else {
		const length = key.bits.length * 4 * 8
		throw new CryptoError(`Illegal key length: ${length} (expected: 256)`)
	}
}

export function assert256BitVersionedKey(key: VersionedKey): VersionedAes256Key {
	return { version: key.version, object: assert256BitKey(key.object) }
}
export type SessionKeyProvider = lazyAsync<AesKey>

/**
 * Only use this if the session key is already available anyway. Do not resolve a session key just to put it inside here, create an actual lazy session key resolver instead.
 * @param sessionKey a session key that you already had lying around for whatever reason
 */
export function sessionKeyProviderFromAvailableSessionKey(sessionKey: Nullable<AesKey>): Nullable<SessionKeyProvider> {
	return sessionKey == null ? null : async (): Promise<AesKey> => sessionKey
}
