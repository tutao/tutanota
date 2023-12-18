import { RsaEccKeyPair, RsaKeyPair, RsaPublicKey } from "./RsaKeyPair.js"
import { PQKeyPairs, PQPublicKeys } from "./PQKeyPairs.js"
import { EccPublicKey } from "./Ecc.js"

export type AsymmetricKeyPair = RsaKeyPair | RsaEccKeyPair | PQKeyPairs
export type AsymmetricPublicKey = RsaPublicKey | PQPublicKeys

export function assertPqKeyPairs(keyPair: AsymmetricKeyPair): PQKeyPairs {
	if (keyPair instanceof PQKeyPairs) {
		return keyPair as PQKeyPairs
	} else {
		throw new Error("invalid key pair")
	}
}

export function assertRsaKeyPair(keyPair: AsymmetricKeyPair): RsaKeyPair {
	if (keyPair instanceof PQKeyPairs) {
		throw new Error("invalid key pair")
	} else {
		return keyPair as RsaKeyPair
	}
}

export function assertRsaEccKeyPair(keyPair: AsymmetricKeyPair): RsaEccKeyPair {
	const anyKeyPair = keyPair as any
	if (anyKeyPair.privateKey && anyKeyPair.privateEccKey) {
		return anyKeyPair as RsaEccKeyPair
	} else {
		throw new Error("invalid key pair")
	}
}
