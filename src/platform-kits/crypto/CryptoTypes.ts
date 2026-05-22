export type HkdfKeyDerivationDomains =
	| "userGroupKeyDistributionKey"
	| "newAdminPubKeyAuthKeyForUserGroupKeyRotation"
	| "adminGroupDistributionKeyPairEncryptionKey"
	| "adminGroupDistKeyPairAuthKeyForMultiAdminRotation"
	| "newAdminSymKeyAuthKeyForMultiAdminRotationAsUser"
	| "newUserGroupKeyAuthKeyForRotationAsNonAdminUser"
	| "versionedUserGroupKeyDistributionKey"
	| "publicIdentityKey"
export type MacTag = Uint8Array & { __brand: "macTag" }
export const UNIT_SEPARATOR_CHAR = "" as const
export type DomainSeparator = `${string}${typeof UNIT_SEPARATOR_CHAR}`
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
