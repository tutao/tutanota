import { AesKey } from "@tutao/crypto"
import { SymmetricCipherVersion } from "../../encryption/symmetric/SymmetricCipherVersion"

export class InstanceSubKeyCache<V> {
	map = new Map<string, V>()

	constructor() {}

	get(key: InstanceSubKeyCacheKey): V | null {
		return this.map.get(this.serializeInstanceSubKeyCacheKey(key)) ?? null
	}
	set(key: InstanceSubKeyCacheKey, value: V): void {
		this.map.set(this.serializeInstanceSubKeyCacheKey(key), value)
	}
	has(key: InstanceSubKeyCacheKey): boolean {
		return this.map.has(this.serializeInstanceSubKeyCacheKey(key))
	}

	private serializeInstanceSubKeyCacheKey(key: InstanceSubKeyCacheKey): string {
		return `${key.cipherVersion},[${key.aesKey.join(",")}]`
	}
}

interface InstanceSubKeyCacheKey {
	cipherVersion: SymmetricCipherVersion
	aesKey: AesKey
}
