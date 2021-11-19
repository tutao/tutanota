// @flow

import type {Base64} from "@tutao/tutanota-utils"

export type RsaKeyPair = {
	publicKey: PublicKey,
	privateKey: PrivateKey,
}

export type PrivateKey = {
	version: number,

	keyLength: number,
	modulus: Base64,
	privateExponent: Base64,
	primeP: Base64,
	primeQ: Base64,
	primeExponentP: Base64,
	primeExponentQ: Base64,
	crtCoefficient: Base64,
}

export type PublicKey = {
	version: number,
	keyLength: number,
	modulus: Base64,
	publicExponent: number,
}