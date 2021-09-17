import Foundation

struct PublicKey : Codable {
  let version: Int
  let keyLength: Int
  let modulus: String
  let publicExponent: Int
}

extension PublicKey {
  init(_ objcKey: TUTPublicKey) {
    self.init(
      version: objcKey.version,
      keyLength: objcKey.keyLength,
      modulus: objcKey.modulus,
      publicExponent: objcKey.publicExponent
    )
  }
  
  func toObjcKey() -> TUTPublicKey {
    return TUTPublicKey(
      version: version,
      keyLength: keyLength,
      modulus: modulus,
      publicExponent: publicExponent
    )
  }
}

struct PrivateKey : Codable {
  let version: Int
  let keyLength: Int
  let modulus: String
  let privateExponent: String
  let primeP: String
  let primeQ: String
  let primeExponentP: String
  let primeExponentQ: String
  let crtCoefficient: String
}

extension PrivateKey {
  init(_ objcKey: TUTPrivateKey) {
    self.init(version: objcKey.version,
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
    return TUTPrivateKey(version: version,
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

struct KeyPair : Codable {
  let publicKey: PublicKey
  let privateKey: PrivateKey
}

extension KeyPair {
  init(_ objcKeyPair: TUTKeyPair) {
    let publicKey = PublicKey(objcKeyPair.publicKey)
    let privateKey = PrivateKey(objcKeyPair.privateKey)
    self.init(publicKey: publicKey, privateKey: privateKey)
  }
}
