import Foundation
import TutanotaSharedFramework

extension RsaPublicKey {
	init(_ objcKey: TUTPublicKey) {
		self.init(version: objcKey.version, keyLength: objcKey.keyLength, modulus: objcKey.modulus, publicExponent: objcKey.publicExponent)
	}

	func toObjcKey() -> TUTPublicKey { TUTPublicKey(version: version, keyLength: keyLength, modulus: modulus, publicExponent: publicExponent) }
}

extension RsaPrivateKey {
	init(_ objcKey: TUTPrivateKey) {
		self.init(
			version: objcKey.version,
			keyLength: objcKey.keyLength,
			modulus: objcKey.modulus,
			privateExponent: objcKey.privateExponent,
			primeP: objcKey.primeP,
			primeQ: objcKey.primeQ,
			primeExponentP: objcKey.primeExponentP,
			primeExponentQ: objcKey.primeExponentQ,
			crtCoefficient: objcKey.crtCoefficient
		)
	}

	func toObjcKey() -> TUTPrivateKey {
		TUTPrivateKey(
			version: version,
			keyLength: keyLength,
			modulus: modulus,
			privateExponent: privateExponent,
			primeP: primeP,
			primeQ: primeQ,
			primeExponentP: primeExponentP,
			primeExponentQ: primeExponentQ,
			crtCoefficient: crtCoefficient
		)
	}
}

extension RsaKeyPair {
	init(_ objcKeyPair: TUTKeyPair) {
		let publicKey = RsaPublicKey(objcKeyPair.publicKey)
		let privateKey = RsaPrivateKey(objcKeyPair.privateKey)
		self.init(publicKey: publicKey, privateKey: privateKey)
	}
}
