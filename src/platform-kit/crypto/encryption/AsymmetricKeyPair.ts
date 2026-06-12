import { RsaKeyPair, RsaPublicKey, RsaX25519KeyPair, RsaX25519PublicKey } from "./RsaKeyPair.js"
import { PQKeyPairs, PQPublicKeys } from "./PQKeyPairs.js"
import { Versioned } from "@tutao/utils"

export enum KeyPairType {
	RSA,
	RSA_AND_X25519,
	TUTA_CRYPT,
}

export abstract class AsymmetricKeyPair {
	protected constructor(public readonly keyPairType: KeyPairType) {}
}

export abstract class PublicKey {
	protected constructor(public readonly keyPairType: KeyPairType) {}
}

export function isPqKeyPairs(keyPair: AsymmetricKeyPair): keyPair is PQKeyPairs {
	return keyPair.keyPairType === KeyPairType.TUTA_CRYPT
}

export function isRsaOrRsaX25519KeyPair(keyPair: AsymmetricKeyPair): keyPair is RsaKeyPair {
	return keyPair.keyPairType === KeyPairType.RSA || keyPair.keyPairType === KeyPairType.RSA_AND_X25519
}

export function isRsaX25519KeyPair(keyPair: AsymmetricKeyPair): keyPair is RsaX25519KeyPair {
	return keyPair.keyPairType === KeyPairType.RSA_AND_X25519
}

export function isPqPublicKey(publicKey: PublicKey): publicKey is PQPublicKeys {
	return publicKey.keyPairType === KeyPairType.TUTA_CRYPT
}

export function isVersionedPqPublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<PQPublicKeys> {
	return isPqPublicKey(versionedPublicKey.object)
}

export function isRsaPublicKey(publicKey: PublicKey): publicKey is RsaPublicKey {
	return publicKey.keyPairType === KeyPairType.RSA
}

export function isVersionedRsaPublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaPublicKey> {
	return isRsaPublicKey(versionedPublicKey.object)
}

export function isRsaX25519PublicKey(publicKey: PublicKey): publicKey is RsaX25519PublicKey {
	return publicKey.keyPairType === KeyPairType.RSA_AND_X25519
}

export function isVersionedRsaX25519PublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaX25519PublicKey> {
	return isRsaX25519PublicKey(versionedPublicKey.object)
}

export function isVersionedRsaOrRsaX25519PublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaPublicKey> {
	return isVersionedRsaPublicKey(versionedPublicKey) || isVersionedRsaX25519PublicKey(versionedPublicKey)
}
