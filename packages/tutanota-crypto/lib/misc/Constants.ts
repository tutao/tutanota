export enum KeyLength {
	b128 = "128",
	b256 = "256",
}
export type EntropySource = "mouse" | "touch" | "key" | "random" | "static" | "time" | "accel"

export type HkdfKeyDerivationDomains = "userGroupKeyDistributionKey" | "adminGroupKeyRotationHash"
