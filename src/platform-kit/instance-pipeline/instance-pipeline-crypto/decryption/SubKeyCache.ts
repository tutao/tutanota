import { AeadSubKeys, AesKey, SymmetricAeadCipherVersion, SymmetricAesCbcCipherVersion, SymmetricSubKeys } from "@tutao/crypto"

export interface SubKeyCache<K, V> {
	set: (instanceSubKeyCacheKey: K, cachedSubKeys: V) => void
	get: (instanceSubKeyCacheKey: K) => V | undefined
	has: (instanceSubKeyCacheKey: K) => boolean
}

export function subKeyCache<K, S extends string | number | boolean, V>(serialize: (key: K) => S): SubKeyCache<K, V> {
	const map = new Map<S, V>()

	return {
		get(key: K): V | undefined {
			return map.get(serialize(key))
		},
		set(key: K, value: V): void {
			map.set(serialize(key), value)
		},
		has(key: K): boolean {
			return map.has(serialize(key))
		},
	}
}

interface InstanceAesSubKeyCacheKey {
	cipherVersion: SymmetricAesCbcCipherVersion
	aesKey: AesKey
}

export type InstanceAesSubKeyCache = SubKeyCache<InstanceAesSubKeyCacheKey, SymmetricSubKeys>

interface InstanceAeadSubKeyCacheKey {
	cipherVersion: SymmetricAeadCipherVersion
	aesKey: AesKey
}

export type InstanceAeadSubKeyCache = SubKeyCache<InstanceAeadSubKeyCacheKey, AeadSubKeys>

export function serializeInstanceSubKeyCacheKey(key: InstanceAesSubKeyCacheKey | InstanceAeadSubKeyCacheKey): string {
	return `${key.cipherVersion},[${key.aesKey.join(",")}]`
}
