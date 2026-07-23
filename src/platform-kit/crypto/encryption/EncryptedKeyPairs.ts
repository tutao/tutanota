export abstract class EncryptedKeyPairs {
	#brand: undefined // make sure the type system understands that this is not the regular KeyPair type
	protected constructor(
		public readonly signature: null | object, //type PublicKeySignature not available in crypto package
	) {}
}

export class EncryptedPqKeyPairs extends EncryptedKeyPairs {
	constructor(
		public readonly pubEccKey: Uint8Array,
		public readonly pubKyberKey: Uint8Array,
		public readonly symEncPrivEccKey: Uint8Array,
		public readonly symEncPrivKyberKey: Uint8Array,
		public override signature: null | object, //type PublicKeySignature not available in crypto package, must be writable
	) {
		super(signature)
	}
}

export class EncryptedRsaKeyPairs extends EncryptedKeyPairs {
	constructor(
		public readonly pubRsaKey: Uint8Array,
		public readonly symEncPrivRsaKey: Uint8Array,
		signature: null | object, //type PublicKeySignature not available in crypto package
	) {
		super(signature)
	}
}

export class EncryptedRsaX25519KeyPairs extends EncryptedRsaKeyPairs {
	constructor(
		public readonly pubEccKey: Uint8Array,
		pubRsaKey: Uint8Array,
		public readonly symEncPrivEccKey: Uint8Array,
		symEncPrivRsaKey: Uint8Array,
		signature: null | object, //type PublicKeySignature not available in crypto package
	) {
		super(pubRsaKey, symEncPrivRsaKey, signature)
	}
}
