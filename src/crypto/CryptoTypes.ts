import { PublicKeyIdentifierType } from "@tutao/app-env"

export type PublicKeyIdentifier = {
	identifier: string
	identifierType: PublicKeyIdentifierType
}
export type CryptoTypes = {
	pubKeyVersion: NumberString
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
	pubRsaKey: null | Uint8Array
}
export enum SigningKeyPairType {
	Ed25519,
}
