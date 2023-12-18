import { EccKeyPair, EccPublicKey } from "./Ecc.js"
import { KyberKeyPair, KyberPublicKey } from "./Liboqs/KyberKeyPair.js"
import { AbstractKeyPair, AbstractPublicKey } from "./AsymmetricKeyPair.js"

export type PQKeyPairs = AbstractKeyPair & {
	eccKeyPair: EccKeyPair
	kyberKeyPair: KyberKeyPair
}

export type PQPublicKeys = AbstractPublicKey & {
	eccPublicKey: EccPublicKey
	kyberPublicKey: KyberPublicKey
}

export function pqKeyPairsToPublicKeys(keyPairs: PQKeyPairs): PQPublicKeys {
	return {
		keyPairType: keyPairs.keyPairType,
		eccPublicKey: keyPairs.eccKeyPair.publicKey,
		kyberPublicKey: keyPairs.kyberKeyPair.publicKey,
	}
}
