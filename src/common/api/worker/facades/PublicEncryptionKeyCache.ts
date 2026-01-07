import { MaybeSignedPublicKey, PublicKeyIdentifier } from "./PublicEncryptionKeyProvider"
import { KeyVersion } from "@tutao/tutanota-utils"
import { PublicKeyIdentifierType, SYSTEM_GROUP_MAIL_ADDRESS } from "../../common/TutanotaConstants"

/**
 * This caches public encryption keys that did not fail key verification / TOFU.
 */
export class PublicEncryptionKeyCache {
	// Versioned<PublicKeyIdentifier> as json string -> MaybeSignedPublicKey
	private readonly cache: Map<string, MaybeSignedPublicKey> = new Map<string, MaybeSignedPublicKey>()
	constructor() {}

	/**
	 * Puts the key into the cache if it does not exist yet (otherwise a noop) and it matches the requirements for caching.
	 */
	put(publicKeyIdentifier: PublicKeyIdentifier, publicEncryptionKey: MaybeSignedPublicKey) {
		const lookupKey = this.makeLookupKey(publicKeyIdentifier, publicEncryptionKey.publicKey.version)
		if (this.cache.has(lookupKey)) {
			return
		}
		if (
			publicEncryptionKey.signature != null ||
			(publicKeyIdentifier.identifierType === PublicKeyIdentifierType.MAIL_ADDRESS && publicKeyIdentifier.identifier === SYSTEM_GROUP_MAIL_ADDRESS)
		) {
			// we only want to cache keys with signatures to ensure that we can always verify them.
			// more and more users should anyway have identity keys and thus signatures as the rollout progresses
			// the only exception is the system user group where we know that no identity key exists,
			// but still want to reduce the number of requests
			this.cache.set(lookupKey, publicEncryptionKey)
		}
	}

	/**
	 * Return a cached public encryption key or null if it is not cached.
	 */
	get(publicKeyIdentifier: PublicKeyIdentifier, version: KeyVersion): MaybeSignedPublicKey | undefined {
		return this.cache.get(this.makeLookupKey(publicKeyIdentifier, version))
	}

	private makeLookupKey(publicKeyIdentifier: PublicKeyIdentifier, version: KeyVersion): string {
		// we use JSON.stringify to get a canonical form and so that we do not have to worry about collisions of these different length parts of the key string
		return JSON.stringify({ version, object: publicKeyIdentifier })
	}
}
