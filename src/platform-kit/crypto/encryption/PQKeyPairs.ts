import { X25519KeyPair, X25519PublicKey } from "./X25519.js"
import { KyberKeyPair, KyberPublicKey } from "./Liboqs/KyberKeyPair.js"
import { PublicKey, AsymmetricKeyPair, KeyPairType } from "./AsymmetricKeyPair.js"

export class PQKeyPairs extends AsymmetricKeyPair {
	constructor(
		public readonly x25519KeyPair: X25519KeyPair,
		public readonly kyberKeyPair: KyberKeyPair,
	) {
		super(KeyPairType.TUTA_CRYPT)
	}
}

export class PQPublicKeys extends PublicKey {
	keyPairType = KeyPairType.TUTA_CRYPT
	constructor(
		public readonly x25519PublicKey: X25519PublicKey,
		public readonly kyberPublicKey: KyberPublicKey,
	) {
		super()
	}
}

export function pqKeyPairsToPublicKeys(keyPairs: PQKeyPairs): PQPublicKeys {
	return {
		keyPairType: keyPairs.keyPairType,
		x25519PublicKey: keyPairs.x25519KeyPair.publicKey,
		kyberPublicKey: keyPairs.kyberKeyPair.publicKey,
	}
}
