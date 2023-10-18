import { X25519KeyPair, X25519Private, X25519Public } from "./X25519.js"
import { KyberKeyPair, KyberPrivateKey, KyberPublicKey } from "./Liboqs/KyberKeyPair.js"

export class PQKeyPairs {
	x25519KeyPair: X25519KeyPair
	kyberKeyPair: KyberKeyPair

	constructor(x25519KeyPair: X25519KeyPair, kyberKeyPair: KyberKeyPair) {
		this.x25519KeyPair = x25519KeyPair
		this.kyberKeyPair = kyberKeyPair
	}

	public toPublicKeys(): PQPublicKeys {
		return new PQPublicKeys(this.x25519KeyPair.pub, this.kyberKeyPair.publicKey)
	}
}

export class PQPublicKeys {
	eccPublicKey: X25519Public
	kyberPublicKey: KyberPublicKey

	constructor(eccPublicKey: X25519Public, kyberPublicKey: KyberPublicKey) {
		this.eccPublicKey = eccPublicKey
		this.kyberPublicKey = kyberPublicKey
	}
}
