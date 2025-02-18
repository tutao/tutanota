import { RsaEccKeyPair, RsaEccPublicKey, RsaKeyPair, RsaPublicKey } from "./RsaKeyPair.js"
import { PQKeyPairs, PQPublicKeys } from "./PQKeyPairs.js"
import { Versioned } from "@tutao/tutanota-utils"

export enum KeyPairType {
	RSA,
	RSA_AND_ECC,
	TUTA_CRYPT,
}

export type AsymmetricKeyPair = RsaKeyPair | RsaEccKeyPair | PQKeyPairs

export type AbstractKeyPair = {
	keyPairType: KeyPairType
}

export type PublicKey = RsaPublicKey | RsaEccPublicKey | PQPublicKeys

export type AbstractPublicKey = {
	keyPairType: KeyPairType
}

export function isPqKeyPairs(keyPair: AbstractKeyPair): keyPair is PQKeyPairs {
	return keyPair.keyPairType === KeyPairType.TUTA_CRYPT
}

export function isRsaOrRsaEccKeyPair(keyPair: AbstractKeyPair): keyPair is RsaKeyPair {
	return keyPair.keyPairType === KeyPairType.RSA || keyPair.keyPairType === KeyPairType.RSA_AND_ECC
}

export function isRsaEccKeyPair(keyPair: AbstractKeyPair): keyPair is RsaEccKeyPair {
	return keyPair.keyPairType === KeyPairType.RSA_AND_ECC
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

export function isRsaEccPublicKey(publicKey: AbstractPublicKey): publicKey is RsaEccPublicKey {
	return publicKey.keyPairType === KeyPairType.RSA_AND_ECC
}

export function isVersionedRsaEccPublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaEccPublicKey> {
	return isRsaEccPublicKey(versionedPublicKey.object)
}

export function isVersionedRsaOrRsaEccPublicKey(versionedPublicKey: Versioned<PublicKey>): versionedPublicKey is Versioned<RsaPublicKey> {
	return isVersionedRsaPublicKey(versionedPublicKey) || isVersionedRsaEccPublicKey(versionedPublicKey)
}
