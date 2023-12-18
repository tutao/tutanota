import type { Base64 } from "@tutao/tutanota-utils"
import { EccPrivateKey, EccPublicKey } from "./Ecc.js"
import { AbstractKeyPair, AbstractPublicKey } from "./AsymmetricKeyPair.js"

export type RsaKeyPair = AbstractKeyPair & {
	publicKey: RsaPublicKey
	privateKey: RsaPrivateKey
}
export type RsaEccKeyPair = RsaKeyPair & {
	publicEccKey: EccPublicKey
	privateEccKey: EccPrivateKey
}
export type RsaPrivateKey = {
	version: number
	keyLength: number
	modulus: Base64
	privateExponent: Base64
	primeP: Base64
	primeQ: Base64
	primeExponentP: Base64
	primeExponentQ: Base64
	crtCoefficient: Base64
}
export type RsaPublicKey = AbstractPublicKey & {
	version: number
	keyLength: number
	modulus: Base64
	publicExponent: number
}
