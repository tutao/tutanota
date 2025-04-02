import { RsaX25519KeyPair, RsaX25519PublicKey, RsaKeyPair, RsaPublicKey } from "./RsaKeyPair.js"
import { PQKeyPairs, PQPublicKeys } from "./PQKeyPairs.js"
import { Versioned } from "@tutao/tutanota-utils"

export enum KeyPairType {
	RSA,
	RSA_AND_X25519,
	TUTA_CRYPT,
}

export type AsymmetricKeyPair = RsaKeyPair | RsaX25519KeyPair | PQKeyPairs

export type AbstractKeyPair = {
	keyPairType: KeyPairType
}

export type PublicKey = RsaPublicKey | RsaX25519PublicKey | PQPublicKeys

export type AbstractPublicKey = {
	keyPairType: KeyPairType
}

export function isPqKeyPairs(keyPair: AbstractKeyPair): keyPair is PQKeyPairs {
	return keyPair.keyPairType === KeyPairType.TUTA_CRYPT
}

export function isRsaOrRsaX25519KeyPair(keyPair: AbstractKeyPair): keyPair is RsaKeyPair {
	return keyPair.keyPairType === KeyPairType.RSA || keyPair.keyPairType === KeyPairType.RSA_AND_X25519
}

export function isRsaX25519KeyPair(keyPair: AbstractKeyPair): keyPair is RsaX25519KeyPair {
	return keyPair.keyPairType === KeyPairType.RSA_AND_X25519
}

export function isPqPublicKey(publicKey: AbstractPublicKey): publicKey is PQPublicKeys {
	return publicKey.keyPairType === KeyPairType.TUTA_CRYPT
}

export function isVersionedPqPublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<PQPublicKeys> {
	return isPqPublicKey(versionedPublicKey.object)
}

export function isRsaPublicKey(publicKey: AbstractPublicKey): publicKey is RsaPublicKey {
	return publicKey.keyPairType === KeyPairType.RSA
}

export function isVersionedRsaPublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaPublicKey> {
	return isRsaPublicKey(versionedPublicKey.object)
}

export function isRsaX25519PublicKey(publicKey: AbstractPublicKey): publicKey is RsaX25519PublicKey {
	return publicKey.keyPairType === KeyPairType.RSA_AND_X25519
}

export function isVersionedRsaX25519PublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaX25519PublicKey> {
	return isRsaX25519PublicKey(versionedPublicKey.object)
}

export function isVersionedRsaOrRsaX25519PublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaPublicKey> {
	return isVersionedRsaPublicKey(versionedPublicKey) || isVersionedRsaX25519PublicKey(versionedPublicKey)
}
