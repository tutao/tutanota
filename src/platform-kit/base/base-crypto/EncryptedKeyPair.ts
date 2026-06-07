import { createKeyPair, KeyPair } from "@tutao/entities/sys"
import { EncryptedKeyPairs, EncryptedPqKeyPairs, EncryptedRsaKeyPairs, EncryptedRsaX25519KeyPairs } from "@tutao/crypto"
import { CryptoError } from "@tutao/crypto/error"
import { downcast } from "@tutao/utils"

export function toEncryptedKeyPair(keyPair: KeyPair): EncryptedKeyPairs {
	if (keyPair.pubRsaKey != null) {
		if (keyPair.pubEccKey != null && keyPair.symEncPrivEccKey != null && keyPair.symEncPrivRsaKey != null) {
			return new EncryptedRsaX25519KeyPairs(keyPair.pubEccKey, keyPair.pubRsaKey, keyPair.symEncPrivEccKey, keyPair.symEncPrivRsaKey, keyPair.signature)
		} else if (keyPair.symEncPrivRsaKey != null) {
			return new EncryptedRsaKeyPairs(keyPair.pubRsaKey, keyPair.symEncPrivRsaKey, keyPair.signature)
		}
	}
	if (keyPair.pubKyberKey != null && keyPair.symEncPrivKyberKey != null && keyPair.pubEccKey != null && keyPair.symEncPrivEccKey != null) {
		return new EncryptedPqKeyPairs(keyPair.pubEccKey, keyPair.pubKyberKey, keyPair.symEncPrivEccKey, keyPair.symEncPrivKyberKey, keyPair.signature)
	}
	throw new CryptoError("Invalid key pair")
}

export function toKeyPair(keyPair: EncryptedKeyPairs): KeyPair {
	if (keyPair instanceof EncryptedRsaX25519KeyPairs) {
		const { pubEccKey, pubRsaKey, symEncPrivEccKey, symEncPrivRsaKey, signature } = keyPair
		return createKeyPair({
			pubKyberKey: null,
			symEncPrivKyberKey: null,
			pubEccKey,
			pubRsaKey,
			symEncPrivEccKey,
			symEncPrivRsaKey,
			signature: downcast(signature),
		})
	} else if (keyPair instanceof EncryptedRsaKeyPairs) {
		const { pubRsaKey, symEncPrivRsaKey, signature } = keyPair
		return createKeyPair({
			pubKyberKey: null,
			symEncPrivKyberKey: null,
			pubEccKey: null,
			symEncPrivEccKey: null,
			pubRsaKey,
			symEncPrivRsaKey,
			signature: downcast(signature),
		})
	} else if (keyPair instanceof EncryptedPqKeyPairs) {
		const { pubEccKey, pubKyberKey, symEncPrivEccKey, symEncPrivKyberKey, signature } = keyPair
		return createKeyPair({
			pubKyberKey,
			symEncPrivKyberKey,
			pubEccKey,
			symEncPrivEccKey,
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			signature: downcast(signature),
		})
	}
	throw new CryptoError("Invalid key pair")
}

export function isEncryptedPqKeyPairs(keyPair: KeyPair): boolean {
	return (
		keyPair.pubEccKey != null &&
		keyPair.pubKyberKey != null &&
		keyPair.symEncPrivEccKey != null &&
		keyPair.symEncPrivKyberKey != null &&
		keyPair.pubRsaKey == null &&
		keyPair.symEncPrivRsaKey == null
	)
}
