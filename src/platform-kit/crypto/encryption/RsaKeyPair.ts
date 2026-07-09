import { X25519PrivateKey, X25519PublicKey } from "./X25519.js"
import { AsymmetricKeyPair, KeyPairType, PublicKey } from "./AsymmetricKeyPair.js"

export class RsaKeyPair extends AsymmetricKeyPair {
	override keyPairType = KeyPairType.RSA
	constructor(
		public readonly publicKey: RsaPublicKey,
		public readonly privateKey: RsaPrivateKey,
	) {
		super()
	}
}
export class RsaX25519KeyPair extends RsaKeyPair {
	override readonly keyPairType = KeyPairType.RSA_AND_X25519
	constructor(
		publicKey: RsaPublicKey,
		privateKey: RsaPrivateKey,
		public readonly publicEccKey: X25519PublicKey,
		public readonly privateEccKey: X25519PrivateKey,
	) {
		super(publicKey, privateKey)
	}
}

export class RsaPrivateKey {
	constructor(
		public readonly version: number,
		public readonly keyLength: number,
		public readonly modulus: Base64,
		public readonly privateExponent: Base64,
		public readonly primeP: Base64,
		public readonly primeQ: Base64,
		public readonly primeExponentP: Base64,
		public readonly primeExponentQ: Base64,
		public readonly crtCoefficient: Base64,
	) {}
}
/**
 * Just the raw values without the keyPair type
 */
export class RsaPublicKey extends PublicKey {
	public override keyPairType = KeyPairType.RSA
	constructor(
		public readonly version: number,
		public readonly keyLength: number,
		public readonly modulus: Base64,
		public readonly publicExponent: number,
	) {
		super()
	}
}

export class RsaX25519PublicKey extends RsaPublicKey {
	public override readonly keyPairType = KeyPairType.RSA_AND_X25519

	constructor(
		rsaPublicKey: RsaPublicKey,
		public readonly publicEccKey: X25519PublicKey,
	) {
		super(rsaPublicKey.version, rsaPublicKey.keyLength, rsaPublicKey.modulus, rsaPublicKey.publicExponent)
	}
}
