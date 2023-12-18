import { RsaEccKeyPair, RsaKeyPair, RsaPublicKey } from "./RsaKeyPair.js"
import { PQKeyPairs, PQPublicKeys } from "./PQKeyPairs.js"

export enum KeyPairType {
	RSA,
	RSA_AND_ECC,
	TUTA_CRYPT,
}

export type AsymmetricKeyPair = RsaKeyPair | RsaEccKeyPair | PQKeyPairs

export type AbstractKeyPair = {
	keyPairType: KeyPairType
}

export type AsymmetricPublicKey = RsaPublicKey | PQPublicKeys

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

export function isRsaPublicKey(publicKey: AbstractPublicKey): publicKey is RsaPublicKey {
	return publicKey.keyPairType === KeyPairType.RSA
}
