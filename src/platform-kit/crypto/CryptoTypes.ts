export enum HkdfKeyDerivationDomains {
	UserGroupKeyDistributionKey = "userGroupKeyDistributionKey",
	NewAdminPubKeyAuthKeyForUserGroupKeyRotation = "newAdminPubKeyAuthKeyForUserGroupKeyRotation",
	AdminGroupDistributionKeyPairEncryptionKey = "adminGroupDistributionKeyPairEncryptionKey",
	AdminGroupDistKeyPairAuthKeyForMultiAdminRotation = "adminGroupDistKeyPairAuthKeyForMultiAdminRotation",
	NewAdminSymKeyAuthKeyForMultiAdminRotationAsUser = "newAdminSymKeyAuthKeyForMultiAdminRotationAsUser",
	NewUserGroupKeyAuthKeyForRotationAsNonAdminUser = "newUserGroupKeyAuthKeyForRotationAsNonAdminUser",
	VersionedUserGroupKeyDistributionKey = "versionedUserGroupKeyDistributionKey",
	PublicIdentityKey = "publicIdentityKey",
}
export type MacTag = Uint8Array & { __brand: "macTag" }
export const UNIT_SEPARATOR_CHAR = "" as const
export type DomainSeparator = `${string}${typeof UNIT_SEPARATOR_CHAR}`
export enum EntropySource {
	Mouse = "mouse",
	Touch = "touch",
	Key = "key",
	Random = "random",
	Static = "static",
	Time = "time",
	Accel = "accel",
}

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
