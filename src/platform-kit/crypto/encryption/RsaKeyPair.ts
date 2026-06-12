import { X25519PrivateKey, X25519PublicKey } from "./X25519.js"
import { PublicKey, AsymmetricKeyPair, KeyPairType } from "./AsymmetricKeyPair.js"

export class RsaKeyPair extends AsymmetricKeyPair {
	constructor(
		public readonly publicKey: RsaPublicKey,
		public readonly privateKey: RsaPrivateKey,
	) {
		super(KeyPairType.RSA)
	}
}
export class RsaX25519KeyPair extends AsymmetricKeyPair {
	constructor(
		public readonly publicEccKey: X25519PublicKey,
		public readonly privateEccKey: X25519PrivateKey,
	) {
		super(KeyPairType.RSA)
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
	constructor(
		public readonly version: number,
		public readonly keyLength: number,
		public readonly modulus: Base64,
		public readonly publicExponent: number,
	) {
		super(KeyPairType.RSA)
	}
}

export class RsaX25519PublicKey extends RsaPublicKey {
	constructor(
		version: number,
		keyLength: number,
		modulus: Base64,
		publicExponent: number,
		public readonly publicEccKey: X25519PublicKey,
	) {
		super(version, keyLength, modulus, publicExponent)
	}
}
