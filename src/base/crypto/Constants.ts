import { CryptoProtocolVersion, GroupKeyRotationType, reverse } from "../../app-env"
import { PublicKeyIdentifierType } from "@tutao/crypto"

export const enum BucketPermissionType {
	Public = "2",
	External = "3",
}

export enum KdfType {
	Bcrypt = "0",
	Argon2id = "1",
}

// The Kdf type to use when deriving new(!) keys from passwords
export const DEFAULT_KDF_TYPE = KdfType.Argon2id
/**
 * The type of signature of a public encryption key, signed with an identity key pair.
 */
export enum PublicKeySignatureType {
	RsaEcc = "0", // the signed public key is RSA ECC key
	TutaCrypt = "1", // the signed public key is a TutaCrypt key
	RsaFormerGroupKey = "2", // the signed public key is a former(!) group key Rsa only (only kept for decryption of existing data)
}

export function asPublicKeySignatureType(maybe: NumberString): PublicKeySignatureType {
	if (Object.values(PublicKeySignatureType).includes(maybe as PublicKeySignatureType)) {
		return maybe as PublicKeySignatureType
	}
	throw new Error("bad public key signature type")
}

export type ExternalUserKeyDeriver = {
	kdfType: KdfType
	salt: Uint8Array
}
export const GroupKeyRotationTypeNameByCode = reverse(GroupKeyRotationType)

export function asCryptoProtoocolVersion(maybe: NumberString): CryptoProtocolVersion {
	if (Object.values(CryptoProtocolVersion).includes(maybe as CryptoProtocolVersion)) {
		return maybe as CryptoProtocolVersion
	}
	throw new Error("bad protocol version")
}

export type CryptoTypes = {
	pubKeyVersion: NumberString
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
	pubRsaKey: null | Uint8Array
}

export function asPublicKeyIdentifier(maybe: NumberString): PublicKeyIdentifierType {
	if (Object.values(PublicKeyIdentifierType).includes(maybe as PublicKeyIdentifierType)) {
		return maybe as PublicKeyIdentifierType
	}
	throw new Error("bad key identifier type")
}

/**
 * Convert the input to KdfType.
 *
 * This actually returns the input without modifying it, as it wraps around TypeScript's 'as' operator, but
 * it also does a runtime check, guaranteeing that the input is truly a KdfType.
 *
 * @param maybe kdf type
 * @return `maybe` as KdfType
 * @throws Error if the input doesn't correspond to a KdfType
 */
export function asKdfType(maybe: string): KdfType {
	if (Object.values(KdfType).includes(maybe as KdfType)) {
		return maybe as KdfType
	}
	throw new Error("bad kdf type")
}
