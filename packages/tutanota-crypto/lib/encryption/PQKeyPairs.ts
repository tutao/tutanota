import { EccKeyPair, EccPrivateKey, EccPublicKey } from "./Ecc.js"
import { KyberKeyPair, KyberPrivateKey, KyberPublicKey } from "./Liboqs/KyberKeyPair.js"

export class PQKeyPairs {
	eccKeyPair: EccKeyPair
	kyberKeyPair: KyberKeyPair

	constructor(eccKeyPair: EccKeyPair, kyberKeyPair: KyberKeyPair) {
		this.eccKeyPair = eccKeyPair
		this.kyberKeyPair = kyberKeyPair
	}

	public toPublicKeys(): PQPublicKeys {
		return new PQPublicKeys(this.eccKeyPair.publicKey, this.kyberKeyPair.publicKey)
	}
}

export class PQPublicKeys {
	eccPublicKey: EccPublicKey
	kyberPublicKey: KyberPublicKey

	constructor(eccPublicKey: EccPublicKey, kyberPublicKey: KyberPublicKey) {
		this.eccPublicKey = eccPublicKey
		this.kyberPublicKey = kyberPublicKey
	}
}
