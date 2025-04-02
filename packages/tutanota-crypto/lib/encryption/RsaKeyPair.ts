import type { Base64 } from "@tutao/tutanota-utils"
import { X25519PrivateKey, X25519PublicKey } from "./X25519.js"
import { AbstractKeyPair, AbstractPublicKey } from "./AsymmetricKeyPair.js"

export type RsaKeyPair = AbstractKeyPair & {
	publicKey: RsaPublicKey
	privateKey: RsaPrivateKey
}
export type RsaX25519KeyPair = RsaKeyPair & {
	publicEccKey: X25519PublicKey
	privateEccKey: X25519PrivateKey
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
export type RsaX25519PublicKey = RsaPublicKey & {
	publicEccKey: X25519PublicKey
}
