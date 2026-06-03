import { KeyVersion, Versioned } from "@tutao/utils"
import { Aes256Key, AesKey } from "./encryption/symmetric/SymmetricCipherUtils"

export type HkdfKeyDerivationDomains =
	| "userGroupKeyDistributionKey"
	| "newAdminPubKeyAuthKeyForUserGroupKeyRotation"
	| "adminGroupDistributionKeyPairEncryptionKey"
	| "adminGroupDistKeyPairAuthKeyForMultiAdminRotation"
	| "newAdminSymKeyAuthKeyForMultiAdminRotationAsUser"
	| "newUserGroupKeyAuthKeyForRotationAsNonAdminUser"
	| "versionedUserGroupKeyDistributionKey"
	| "publicIdentityKey"
export type MacTag = Uint8Array & { readonly __brand: "macTag" }
export const UNIT_SEPARATOR_CHAR = "" as const
export type DomainSeparator = `${string}${typeof UNIT_SEPARATOR_CHAR}`
export const AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN: DomainSeparator = `attributeEncGK${UNIT_SEPARATOR_CHAR}`
export const AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN: DomainSeparator = `attributeEncSK${UNIT_SEPARATOR_CHAR}`
export const AEAD_GROUP_KEY_NONCE_DERIVATION: DomainSeparator = `GK and nonce instanceMessageKey${UNIT_SEPARATOR_CHAR}`
export const AEAD_SESSION_KEY_DERIVATION: DomainSeparator = `SK instanceSessionKey${UNIT_SEPARATOR_CHAR}`
export type EntropySource = "mouse" | "touch" | "key" | "random" | "static" | "time" | "accel"

export enum KeyLength {
	b128 = "128",
	b256 = "256",
}

export enum SigningKeyPairType {
	Ed25519,
}
export enum PublicKeyIdentifierType {
	MAIL_ADDRESS = "0",
	GROUP_ID = "1",
	KEY_ROTATION_ID = "2",
}

export type PublicKeyIdentifier = {
	identifier: string
	identifierType: PublicKeyIdentifierType
}

/**
 * An AesKey (usually a group key) and its version.
 */
export type VersionedKey = Versioned<AesKey>
export type VersionedAes256Key = Versioned<Aes256Key>
/**
 * A key that is encrypted with a given version of some other key.
 */
export type VersionedEncryptedKey = {
	encryptingKeyVersion: KeyVersion // the version of the encryption key NOT the encrypted key
	key: Uint8Array // encrypted key
}
